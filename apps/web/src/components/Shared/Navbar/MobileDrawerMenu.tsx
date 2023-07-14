import Support from '@components/Shared/Navbar/NavItems/Support';
import { XIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import type { Profile } from 'lens';
import formatHandle from 'lib/formatHandle';
import getAvatar from 'lib/getAvatar';
import isGardener from 'lib/isGardener';
import isStaff from 'lib/isStaff';
import Link from 'next/link';
import type { FC } from 'react';
import { useAppStore } from 'src/store/app';
import { useGlobalModalStateStore } from 'src/store/modals';
import { Image } from 'ui';

import Slug from '../Slug';
import AppVersion from './NavItems/AppVersion';
import Logout from './NavItems/Logout';
import Mod from './NavItems/Mod';
import ModMode from './NavItems/ModMode';
import Settings from './NavItems/Settings';
import StaffMode from './NavItems/StaffMode';
import Status from './NavItems/Status';
import SwitchProfile from './NavItems/SwitchProfile';
import ThemeSwitch from './NavItems/ThemeSwitch';
import YourProfile from './NavItems/YourProfile';

const MobileDrawerMenu: FC = () => {
  const profiles = useAppStore((state) => state.profiles);
  const currentProfile = useAppStore((state) => state.currentProfile);
  const setShowMobileDrawer = useGlobalModalStateStore((state) => state.setShowMobileDrawer);

  const closeDrawer = () => {
    setShowMobileDrawer(false);
  };

  return (
    <div className="no-scrollbar fixed inset-0 z-10 h-full w-full overflow-y-auto bg-gray-100 py-4 dark:bg-black md:hidden">
      <button className="px-5" type="button" onClick={closeDrawer}>
        <XIcon className="h-6 w-6" />
      </button>
      <div className="w-full space-y-2">
        <Link
          onClick={closeDrawer}
          href={`/u/${formatHandle(currentProfile?.handle)}`}
          className="mt-2 flex items-center space-x-2 px-5 py-3 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <div className="flex w-full space-x-1.5">
            <Image
              onError={({ currentTarget }) => {
                currentTarget.src = getAvatar(currentProfile, false);
              }}
              src={getAvatar(currentProfile as Profile)}
              className="h-12 w-12 cursor-pointer rounded-full border dark:border-gray-700"
              alt={formatHandle(currentProfile?.handle)}
            />
            <div>
              <Trans>Logged in as</Trans>
              <div className="truncate">
                <Slug className="font-bold" slug={formatHandle(currentProfile?.handle)} prefix="@" />
              </div>
            </div>
          </div>
        </Link>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          {profiles.length > 1 && (
            <SwitchProfile className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" />
          )}
          <div className="divider" />
          <Status className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" />
          <div className="divider" />
        </div>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <div>
            <Link href={`/u/${formatHandle(currentProfile?.handle)}`} onClick={closeDrawer}>
              <YourProfile className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" />
            </Link>
            <Link href={'/settings'} onClick={closeDrawer}>
              <Settings className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" />
            </Link>
            {isGardener(currentProfile?.id) && (
              <Link href="/mod" onClick={closeDrawer}>
                <Mod className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" />
              </Link>
            )}
            <ThemeSwitch className="py-3 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={closeDrawer} />
          </div>
          <div className="divider" />
        </div>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <div>
            <Support className="py-3 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={closeDrawer} />
          </div>
          <div className="divider" />
        </div>

        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <div className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <Logout onClick={closeDrawer} className="py-3" />
          </div>
          <div className="divider" />
          {isGardener(currentProfile?.id) && (
            <>
              <div
                onClick={closeDrawer}
                className="hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-hidden="true"
              >
                <ModMode className="py-3" />
              </div>
              <div className="divider" />
            </>
          )}
          {isStaff(currentProfile?.id) && (
            <>
              <div
                onClick={closeDrawer}
                className="hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-hidden="true"
              >
                <StaffMode className="py-3" />
              </div>
              <div className="divider" />
            </>
          )}
        </div>
        {currentProfile && <AppVersion />}
      </div>
    </div>
  );
};

export default MobileDrawerMenu;
