import MentionsPlugin from '@components/Shared/Lexical/Plugins/AtMentionsPlugin';
import LexicalAutoLinkPlugin from '@components/Shared/Lexical/Plugins/AutoLinkPlugin';
import EmojiPickerPlugin from '@components/Shared/Lexical/Plugins/EmojiPicker';
import EmojisPlugin from '@components/Shared/Lexical/Plugins/EmojisPlugin';
import ImagesPlugin from '@components/Shared/Lexical/Plugins/ImagesPlugin';
import ToolbarPlugin from '@components/Shared/Lexical/Plugins/ToolbarPlugin';
import useUploadAttachments from '@components/utils/hooks/useUploadAttachments';
import { $convertToMarkdownString, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { t, Trans } from '@lingui/macro';
import Errors from 'data/errors';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { usePublicationStore } from 'src/store/publication';

import type { QuadraticRound } from '../NewPublication';

const TRANSFORMERS = [...TEXT_FORMAT_TRANSFORMERS];

interface Props {
  selectedQuadraticRound: QuadraticRound;
  editor: LexicalEditor;
}

const Editor: FC<Props> = ({ selectedQuadraticRound, editor }) => {
  const publicationContent = usePublicationStore((state) => state.publicationContent);
  const setPublicationContent = usePublicationStore((state) => state.setPublicationContent);
  const attachments = usePublicationStore((state) => state.attachments);
  const { handleUploadAttachments } = useUploadAttachments();
  // const [editor] = useLexicalComposerContext();
  const prevQuadraticRoundRef = useRef('');

  const handlePaste = async (pastedFiles: FileList) => {
    if (attachments.length === 4 || attachments.length + pastedFiles.length > 4) {
      return toast.error(t`Please choose either 1 video or up to 4 photos.`);
    }

    if (pastedFiles) {
      await handleUploadAttachments(pastedFiles);
    }
  };

  useEffect(() => {
    prevQuadraticRoundRef.current = selectedQuadraticRound.id;
  }, []);

  useEffect(() => {
    const prevQuadraticRound = prevQuadraticRoundRef.current;

    if (selectedQuadraticRound.id !== prevQuadraticRound) {
      let newNotification: string;

      if (selectedQuadraticRound.id !== '') {
        newNotification = `Your post will be included in the ${selectedQuadraticRound.id} round.`;

        editor.update(() => {
          const p = $createParagraphNode();
          console.log('prev round', prevQuadraticRound);
          p.append($createTextNode(newNotification).setMode('token'));
          const notificationNode = $getRoot()
            .getAllTextNodes()
            .find((node) => {
              return node
                .getTextContent()
                .includes(`Your post will be included in the ${prevQuadraticRound} round.`);
            });
          notificationNode ? notificationNode.replace(p) : $getRoot().append(p);
        });
      } else {
        // This needs to be updated to remove the node if seletecQuadraticRound is empty
        editor.update(() => {
          const textNodes = $getRoot().getAllTextNodes();
          textNodes.forEach((node) => {
            if (node.getTextContent().includes(`Your post will be included in the`)) {
              console.log('notification delete', newNotification);
              node.replace($createTextNode(''));
            }
          });
        });
      }

      prevQuadraticRoundRef.current = selectedQuadraticRound.id;
    }
  }, [selectedQuadraticRound, editor, publicationContent, setPublicationContent]);

  return (
    <div className="relative">
      <EmojiPickerPlugin />
      <ToolbarPlugin />
      <RichTextPlugin
        contentEditable={<ContentEditable className="my-4 block min-h-[65px] overflow-auto px-5" />}
        placeholder={
          <div className="pointer-events-none absolute top-[65px] whitespace-nowrap px-5 text-gray-400">
            <Trans>What's happening?</Trans>
          </div>
        }
        ErrorBoundary={() => <div>{Errors.SomethingWentWrong}</div>}
      />

      <OnChangePlugin
        onChange={(editorState) => {
          editorState.read(() => {
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            setPublicationContent(markdown);
          });
        }}
      />
      <EmojisPlugin />
      <LexicalAutoLinkPlugin />
      <HistoryPlugin />
      <HashtagPlugin />
      <MentionsPlugin />
      <ImagesPlugin onPaste={handlePaste} />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </div>
  );
};

export default Editor;
