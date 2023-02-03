import { Button } from '@components/UI/Button';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import { Input } from '@components/UI/Input';
import { Spinner } from '@components/UI/Spinner';
import { Toggle } from '@components/UI/Toggle';
import {
  ClockIcon,
  CollectionIcon,
  StarIcon,
  SwitchHorizontalIcon,
  UserGroupIcon
} from '@heroicons/react/outline';
import { Analytics } from '@lib/analytics';
import { t, Trans } from '@lingui/macro';
import { ethers } from 'ethers';
import type { Erc20 } from 'lens';
import { CollectModules, useEnabledModulesQuery } from 'lens';
import type { Dispatch, FC } from 'react';
import { useEffect, useState } from 'react';
import { useAccessSettingsStore } from 'src/store/access-settings';
import { useAppStore } from 'src/store/app';
import { useCollectModuleStore } from 'src/store/collect-module';
import { PUBLICATION } from 'src/tracking';

interface Props {
  setShowModal: Dispatch<boolean>;
}

const CollectForm: FC<Props> = ({ setShowModal }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const selectedCollectModule = useCollectModuleStore((state) => state.selectedCollectModule);
  const setSelectedCollectModule = useCollectModuleStore((state) => state.setSelectedCollectModule);
  const amount = useCollectModuleStore((state) => state.amount);
  const setAmount = useCollectModuleStore((state) => state.setAmount);
  const selectedCurrency = useCollectModuleStore((state) => state.selectedCurrency);
  const setSelectedCurrency = useCollectModuleStore((state) => state.setSelectedCurrency);
  const referralFee = useCollectModuleStore((state) => state.referralFee);
  const setReferralFee = useCollectModuleStore((state) => state.setReferralFee);
  const collectLimit = useCollectModuleStore((state) => state.collectLimit);
  const setCollectLimit = useCollectModuleStore((state) => state.setCollectLimit);
  const hasTimeLimit = useCollectModuleStore((state) => state.hasTimeLimit);
  const setHasTimeLimit = useCollectModuleStore((state) => state.setHasTimeLimit);
  const followerOnly = useCollectModuleStore((state) => state.followerOnly);
  const setFollowerOnly = useCollectModuleStore((state) => state.setFollowerOnly);
  const quadraticRound = useCollectModuleStore((state) => state.quadraticRound);
  const setQuadraticRound = useCollectModuleStore((state) => state.setQuadraticRound);
  const setPayload = useCollectModuleStore((state) => state.setPayload);
  const reset = useCollectModuleStore((state) => state.reset);
  const setCollectToView = useAccessSettingsStore((state) => state.setCollectToView);
  const [toggleCollectEnabled, setToggleCollectEnabled] = useState(false);
  const [toggleQuadraticEnabled, setToggleQuadraticEnabled] = useState(false);

  const {
    RevertCollectModule,
    FreeCollectModule,
    FeeCollectModule,
    LimitedFeeCollectModule,
    LimitedTimedFeeCollectModule,
    TimedFeeCollectModule,
    UnknownCollectModule
  } = CollectModules;

  useEffect(() => {
    const baseFeeData = {
      amount: {
        currency: selectedCurrency,
        value: amount
      },
      recipient: currentProfile?.ownedBy,
      referralFee: parseFloat(referralFee ?? '0'),
      followerOnly
    };

    switch (selectedCollectModule) {
      case RevertCollectModule:
        setCollectToView(false);
        setPayload({ revertCollectModule: true });
        break;
      case FreeCollectModule:
        setPayload({ freeCollectModule: { followerOnly } });
        break;
      case FeeCollectModule:
        setPayload({
          feeCollectModule: { ...baseFeeData }
        });
        break;
      case LimitedFeeCollectModule:
      case LimitedTimedFeeCollectModule:
        setPayload({
          [selectedCollectModule === LimitedFeeCollectModule
            ? 'limitedFeeCollectModule'
            : 'limitedTimedFeeCollectModule']: {
            ...baseFeeData,
            collectLimit
          }
        });
        break;
      case TimedFeeCollectModule:
        setPayload({ timedFeeCollectModule: { ...baseFeeData } });
        break;
      case UnknownCollectModule:
        const encodedQuadraticData = ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint16', 'address', 'address'],
          [
            selectedCurrency,
            referralFee,
            '0xCb964E66dD4868e7C71191D3A1353529Ad1ED2F5',
            '0x10c5e410A0b28D80144099741ae6FcAE4a77833c'
          ]
        );

        setPayload({
          unknownCollectModule: {
            contractAddress: '0x4Ff23872ca1C46410514f29FFA44F1e9a978fb1C',
            data: encodedQuadraticData
          }
        });
        break;
      default:
        setPayload({ revertCollectModule: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, referralFee, collectLimit, hasTimeLimit, followerOnly, selectedCollectModule]);

  useEffect(() => {
    if (hasTimeLimit) {
      if (amount) {
        setSelectedCollectModule(collectLimit ? LimitedTimedFeeCollectModule : TimedFeeCollectModule);
      } else {
        setHasTimeLimit(false);
        setSelectedCollectModule(collectLimit ? LimitedTimedFeeCollectModule : FreeCollectModule);
      }
    } else {
      if (amount) {
        setSelectedCollectModule(collectLimit ? LimitedFeeCollectModule : FeeCollectModule);
      } else {
        setCollectLimit(null);
        setSelectedCollectModule(collectLimit ? LimitedFeeCollectModule : FreeCollectModule);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, collectLimit, hasTimeLimit]);

  const { error, data, loading } = useEnabledModulesQuery();

  if (loading) {
    return (
      <div className="py-3.5 px-5 space-y-2 font-bold text-center">
        <Spinner size="md" className="mx-auto" />
        <div>
          <Trans>Loading collect settings</Trans>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage className="p-5" title={t`Failed to load modules`} error={error} />;
  }
  const toggleQuadratic = () => {
    setToggleQuadraticEnabled(!toggleQuadraticEnabled);
    Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_COLLECT_MODULE);

    if (toggleCollectEnabled) {
      setToggleCollectEnabled(false);
    }

    if (!toggleQuadraticEnabled) {
      setQuadraticRound(true);
      setReferralFee('0');
      setSelectedCollectModule(UnknownCollectModule);
    } else {
      reset();
      setSelectedCollectModule(RevertCollectModule);
    }
  };

  const toggleCollect = () => {
    setToggleCollectEnabled(!toggleCollectEnabled);
    Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_COLLECT_MODULE);

    if (toggleQuadraticEnabled) {
      setToggleQuadraticEnabled(false);
    }

    if (!toggleCollectEnabled) {
      setSelectedCollectModule(FreeCollectModule);
    } else {
      reset();
      setSelectedCollectModule(RevertCollectModule);
    }
  };

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center space-x-2">
        <Toggle
          on={selectedCollectModule !== RevertCollectModule && toggleQuadraticEnabled}
          setOn={toggleQuadratic}
        />

        <div className="lt-text-gray-500 text-sm font-bold">
          <Trans>Quadratic Tipping </Trans>
        </div>
      </div>
      {selectedCollectModule !== RevertCollectModule && toggleQuadraticEnabled && (
        <div className="ml-5">
          <div>lorem ipsum lots of text</div>
          <div className="space-y-2 pt-5">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-4 w-4 text-brand-500" />
              <span>
                <Trans>Who can tip this post</Trans>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Toggle
                on={followerOnly}
                setOn={() => {
                  setFollowerOnly(!followerOnly);
                  Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_FOLLOWERS_ONLY_COLLECT);
                }}
              />
              <div className="lt-text-gray-500 text-sm font-bold">
                <Trans>Only followers can collect</Trans>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Toggle
          on={selectedCollectModule !== RevertCollectModule && toggleCollectEnabled}
          setOn={toggleCollect}
        />
        <div className="lt-text-gray-500 text-sm font-bold">
          <Trans>This post can be collected</Trans>
        </div>
      </div>
      {selectedCollectModule !== RevertCollectModule && toggleCollectEnabled && (
        <div className="ml-5">
          <div className="space-y-2 pt-3">
            <div className="flex items-center space-x-2">
              <CollectionIcon className="h-4 w-4 text-brand-500" />
              <span>
                <Trans>Charge for collecting</Trans>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Toggle
                on={Boolean(amount)}
                setOn={() => {
                  setAmount(amount ? null : '0');
                  Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_CHARGE_FOR_COLLECT);
                }}
              />
              <div className="lt-text-gray-500 text-sm font-bold">
                <Trans>Get paid whenever someone collects your post</Trans>
              </div>
            </div>
            {amount ? (
              <div className="pt-2">
                <div className="text-sm flex space-x-2">
                  <Input
                    label={t`Price`}
                    type="number"
                    placeholder="0.5"
                    min="0"
                    max="100000"
                    value={parseFloat(amount)}
                    onChange={(event) => {
                      setAmount(event.target.value ? event.target.value : '0');
                    }}
                  />
                  <div>
                    <div className="label">
                      <Trans>Select Currency</Trans>
                    </div>
                    <select
                      className="w-full bg-white rounded-xl border border-gray-300 outline-none dark:bg-gray-800 disabled:bg-gray-500 disabled:bg-opacity-20 disabled:opacity-60 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-400"
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                      {data?.enabledModuleCurrencies.map((currency: Erc20) => (
                        <option
                          key={currency.address}
                          value={currency.address}
                          selected={currency?.address === selectedCurrency}
                        >
                          {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 pt-5">
                  <div className="flex items-center space-x-2">
                    <SwitchHorizontalIcon className="h-4 w-4 text-brand-500" />
                    <span>
                      <Trans>Mirror referral reward</Trans>
                    </span>
                  </div>
                  <div className="lt-text-gray-500 text-sm font-bold">
                    <Trans>Share your collect fee with people who amplify your content</Trans>
                  </div>
                  <div className="text-sm pt-2 flex space-x-2">
                    <Input
                      label={t`Referral fee`}
                      type="number"
                      placeholder="5"
                      iconRight="%"
                      min="0"
                      max="100"
                      value={parseFloat(referralFee ?? '0')}
                      onChange={(event) => {
                        setReferralFee(event.target.value ? event.target.value : '0');
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {selectedCollectModule !== FreeCollectModule && amount && toggleCollectEnabled && (
            <>
              <div className="space-y-2 pt-5">
                <div className="flex items-center space-x-2">
                  <StarIcon className="h-4 w-4 text-brand-500" />
                  <span>
                    <Trans>Limited edition</Trans>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Toggle
                    on={Boolean(collectLimit)}
                    setOn={() => {
                      setCollectLimit(collectLimit ? null : '1');
                      Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_LIMITED_EDITION_COLLECT);
                    }}
                  />
                  <div className="lt-text-gray-500 text-sm font-bold">
                    <Trans>Make the collects exclusive</Trans>
                  </div>
                </div>
                {collectLimit ? (
                  <div className="text-sm pt-2 flex space-x-2">
                    <Input
                      label={t`Collect limit`}
                      type="number"
                      placeholder="5"
                      min="1"
                      max="100000"
                      value={parseFloat(collectLimit)}
                      onChange={(event) => {
                        setCollectLimit(event.target.value ? event.target.value : '1');
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 pt-5">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-brand-500" />
                  <span>
                    <Trans>Time limit</Trans>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Toggle
                    on={hasTimeLimit}
                    setOn={() => {
                      setHasTimeLimit(!hasTimeLimit);
                      Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_TIME_LIMIT_COLLECT);
                    }}
                  />
                  <div className="lt-text-gray-500 text-sm font-bold">
                    <Trans>Limit collecting to the first 24h</Trans>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="space-y-2 pt-5">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-4 w-4 text-brand-500" />
              <span>
                <Trans>Who can collect</Trans>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Toggle
                on={followerOnly}
                setOn={() => {
                  setFollowerOnly(!followerOnly);
                  Analytics.track(PUBLICATION.NEW.COLLECT_MODULE.TOGGLE_FOLLOWERS_ONLY_COLLECT);
                }}
              />
              <div className="lt-text-gray-500 text-sm font-bold">
                <Trans>Only followers can collect</Trans>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pt-5 flex space-x-2">
        <Button
          className="ml-auto"
          variant="danger"
          outline
          onClick={() => {
            reset();
            setShowModal(false);
          }}
        >
          <Trans>Cancel</Trans>
        </Button>
        <Button onClick={() => setShowModal(false)}>
          <Trans>Save</Trans>
        </Button>
      </div>
    </div>
  );
};

export default CollectForm;
