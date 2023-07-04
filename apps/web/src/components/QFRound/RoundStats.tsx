import type { RoundStats as RoundStatsType } from '@components/Publication/Actions/Tip/QuadraticQueries/grantsQueries';
import { useGetRoundMeta } from '@components/Publication/Actions/Tip/QuadraticQueries/grantsQueries';
import PublicationRow from '@components/QFRound/PublicationRow';
import { t, Trans } from '@lingui/macro';
import { Card } from 'ui';

const Item = ({ title, value }: { title: string; value: string | number }) => (
  <div className="mb-2 flex basis-1/4 flex-col">
    <div className="lt-text-gray-500 text-sm">{title}</div>
    <div className="font-extrabold">{value}</div>
  </div>
);

export const RoundStats = ({ stats }: { roundId: string; stats: RoundStatsType }) => {
  const { data: metaData } = useGetRoundMeta(stats.roundMetaPtr);

  return (
    <div className="">
      <div className="mb-4 text-2xl font-extrabold uppercase">{metaData?.name || 'Loading...'}</div>
      {metaData?.description && <div className="mb-4">{metaData.description}</div>}
      <div className="flex w-full flex-wrap">
        <Item title={t`Total of all tips`} value={`$ ${stats.totalTipped}`} />
        <Item title={t`Total match`} value={`$ ${stats.totalMatched}`} />
        <Item title={t`Posts receiving tips`} value={stats.uniqueTippedPosts} />
        <Item title={t`Unique tippers`} value={stats.uniqueTippers} />
        <Item title={t`Average tip`} value={`$ ${stats.averageTip}`} />
        <Item title={t`Average tips per post`} value={stats.averageTipsPerPost} />
      </div>
      {!!stats.posts.length && (
        <div className="mt-4 space-y-4">
          <div className="mt-4">
            <div className="lt-text-gray-500 mb-2 text-sm">
              <Trans>Most popular posts in round</Trans>
            </div>
            <Card className="divide-y-[1px] dark:divide-gray-700">
              {stats.posts.map(({ publicationId, uniqueContributors, totalTippedInToken }) => (
                <PublicationRow
                  key={publicationId}
                  publicationId={publicationId}
                  totalTipped={totalTippedInToken}
                  uniqueContributors={uniqueContributors}
                />
              ))}
            </Card>
          </div>
          <div>
            <div className="lt-text-gray-500 mb-2 text-sm">
              <Trans>All posts in this round ({stats.posts.length})</Trans>
            </div>
            <Card className="divide-y-[1px] dark:divide-gray-700">
              {stats.posts.map(({ publicationId, uniqueContributors, totalTippedInToken }) => (
                <PublicationRow
                  key={publicationId}
                  publicationId={publicationId}
                  totalTipped={totalTippedInToken}
                  uniqueContributors={uniqueContributors}
                />
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
