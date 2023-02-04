import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Column } from 'react-table';
import Layout from '@components/layout';
import AccessDenied from '@components/AccessDenied';
import { AdAccount } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import { Campaign, CampaignRequestDTO } from '@models/Campaign';
import CampaignModal from '@components/CampaignModal';

const organization_id = 'b16eb6ba-1631-40cc-8317-ac46933690b5';

interface AdAccountWithAction extends AdAccount {
  _status: 'text-neutral-500' | 'text-neutral-800' | 'text-red-500' | 'text-emerald-500';
  _statusMessage: string;
}

export default function AdAccountsPage() {
  const { data: session } = useSession();
  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccountWithAction[]>([]);
  const [viewCampaignCtx, setViewCampaignCtx] = useState<{
    loading: boolean;
    ad_account_id: string | null;
    campaigns: Campaign[];
    modalID: string;
  }>({
    loading: false,
    ad_account_id: null,
    campaigns: [],
    modalID: 'view-campaign-modal',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/organizations/${organization_id}/adaccounts`)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then((data) => {
        setAccounts(
          data.adaccounts.map(
            ({ adaccount }: any) =>
              ({
                ...adaccount,
                _status: 'text-neutral-500',
                _statusMessage: 'No action',
              } as AdAccountWithAction),
          ),
        );
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        alert(error.message);
      });
  }, []);

  useEffect(() => {
    if (viewCampaignCtx.ad_account_id) {
      setViewCampaignCtx((pre) => ({ ...pre, loading: true }));

      fetch(`/api/adaccounts/${viewCampaignCtx.ad_account_id}/campaigns`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          const campaigns = data.campaigns.map(({ campaign }: any) => campaign as Campaign);
          setViewCampaignCtx((pre) => ({ ...pre, campaigns, loading: false }));
        })
        .catch((error) => {
          setViewCampaignCtx((pre) => ({ ...pre, campaigns: [], loading: false }));
        });
    }
  }, [viewCampaignCtx.ad_account_id]);

  const onViewCampaign = (ad_account_id: string): void => {
    setViewCampaignCtx((pre) => ({ ...pre, ad_account_id }));
  };

  const columns: Column<AdAccountWithAction>[] = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', sortType: 'basic' },
      {
        Header: 'Status',
        accessor: 'status',
        sortType: 'basic',
        Cell: ({ value }) => (
          <div className={`badge badge-outline ${value === 'ACTIVE' ? 'badge-success' : ''}`}>{value}</div>
        ),
      },
      { Header: 'Currency', accessor: 'currency', Cell: ({ value }) => <div className="badge">{value}</div> },
      {
        Header: 'Campaigns',
        Cell: ({ row: { original } }: { row: { original: AdAccountWithAction } }) => {
          return (
            <label
              htmlFor="view-campaign-modal"
              className="btn btn-ghost btn-xs"
              onClick={() => onViewCampaign(original.id)}
            >
              View
            </label>
          );
        },
      },
      {
        Header: 'Actions',
        accessor: '_statusMessage',
        Cell: ({ value, row }) => <p className={`w-full ${row.original._status}`}>{value}</p>,
      },
    ],
    [],
  );

  const { renderTable, selectedFlatRows } = useTable({
    columns,
    data: accounts,
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const ad_account_ids = selectedFlatRows.map((account: AdAccount) => account.id);

    const name = event.target.name.value;
    const status = event.target.status.value;
    const start_time = event.target.start_time.value
      ? new Date(event.target.start_time.value).toISOString()
      : undefined;
    const end_time = event.target.end_time.value ? new Date(event.target.end_time.value).toISOString() : undefined;
    const daily_budget_micro = event.target.daily_budget_micro.value
      ? Number(event.target.daily_budget_micro.value)
      : undefined;
    const lifetime_spend_cap_micro = event.target.lifetime_spend_cap_micro.value
      ? Number(event.target.lifetime_spend_cap_micro.value)
      : undefined;

    if (ad_account_ids.length === 0 || !name) {
      return;
    }
    const data = { name, status, start_time, end_time, daily_budget_micro, lifetime_spend_cap_micro };

    for await (const ad_account_id of ad_account_ids) {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-neutral-800',
            _statusMessage: 'Creating draft campaign...',
          };
        }),
      );

      const createPayload: CampaignRequestDTO = {
        ad_account_id,
        name,
        status,
        start_time,
        end_time,
        daily_budget_micro,
        lifetime_spend_cap_micro,
      };

      await processCampaign(createPayload);
    }
  };

  const processCampaign = async (createData: CampaignRequestDTO): Promise<void> => {
    const JSONdata = JSON.stringify(createData);
    const endpoint = '/api/campaigns/create';
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
    const response = await fetch(endpoint, options);

    const result = await response.json();
    const createdCampaign = _.get(result, 'campaigns[0].campaign', null);

    if (createdCampaign?.id) {
      await updateCampaign({ ...createData, id: createdCampaign.id });
    } else {
      const _statusMessage = _.get(result, 'campaigns[0].sub_request_error_reason') || 'Create draft campaign failed';

      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== createData.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-red-500',
            _statusMessage,
          };
        }),
      );
    }
  };

  const updateCampaign = async (data: CampaignRequestDTO): Promise<void> => {
    const JSONdata = JSON.stringify(data);
    const endpoint = '/api/campaigns/update';
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
    const response = await fetch(endpoint, options);
    const result = await response.json();

    const updatedCampaign = _.get(result, 'campaigns[0].campaign', null);
    if (updatedCampaign?.id) {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== data.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-emerald-500',
            _statusMessage: 'New campaign successfully created',
          };
        }),
      );
    } else {
      const _statusMessage = _.get(result, 'campaigns[0].sub_request_error_reason') || 'Update draft campaign failed';

      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== data.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-red-500',
            _statusMessage,
          };
        }),
      );
    }
  };

  const selectedAccountNames = useMemo(
    () => selectedFlatRows?.map((acc: AdAccount) => acc.name)?.join(', ') || '',
    [selectedFlatRows],
  );

  const disabledSubmit = useMemo(() => selectedFlatRows.length === 0, [selectedFlatRows]);

  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="m-2">
        {isLoading ? 'Loading...' : `OrgID: ${organization_id} has ${accounts.length} accounts.`}
      </div>
      <div className="flex flex-col">
        <form noValidate className="form-control bg-stone-300 gap-2 p-4 m-4 rounded-lg" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="label label-text">Campaign name</span>
              <input type="text" id="name" placeholder="Type here" className="input input-bordered input-sm w-full" />
            </div>

            <div className="flex-1 flex flex-col">
              <span className="label label-text">Campaign status</span>
              <select className="select select-bordered select-sm" id="status">
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Pause</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="label label-text">Start time</span>
              <input
                type="datetime-local"
                id="start_time"
                placeholder="Type here"
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="flex-1">
              <span className="label label-text">End time</span>
              <input
                type="datetime-local"
                id="end_time"
                placeholder="Type here"
                className="input input-bordered input-sm w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="label label-text">Daily Spend Cap (micro-currency) </span>
              <input
                type="number"
                id="daily_budget_micro"
                placeholder="Type here"
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="flex-1">
              <span className="label label-text">Lifetime spend cap for the campaign (micro-currency) </span>
              <input
                type="number"
                id="lifetime_spend_cap_micro"
                placeholder="Type here"
                className="input input-bordered input-sm w-full"
              />
            </div>
          </div>
          <span className="label label-text">Selected {selectedFlatRows.length} accounts</span>
          <textarea className="textarea" disabled value={selectedAccountNames} />
          <div className="flex justify-end">
            <button className="btn btn-active btn-primary btn-sm" type="submit" disabled={disabledSubmit}>
              {`Create campaigns for selected accounts`}
            </button>
          </div>
        </form>
        <div className="w-full">{renderTable()}</div>
        <CampaignModal
          modalID={viewCampaignCtx.modalID}
          campaigns={viewCampaignCtx.campaigns}
          loading={viewCampaignCtx.loading}
        />
      </div>
    </Layout>
  );
}
