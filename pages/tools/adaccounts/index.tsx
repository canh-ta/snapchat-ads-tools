import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
const { DateTime } = require('luxon');
import { Column } from 'react-table';
import Layout from '@components/layout';
import AccessDenied from '@components/AccessDenied';
import { AdAccountDTO } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import { CampaignDTO } from '@models/Campaign';
import CampaignModal from '@components/CampaignModal';

const organization_id = 'b16eb6ba-1631-40cc-8317-ac46933690b5';

export default function AdAccountsPage() {
  const { data: session } = useSession();
  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccountDTO[]>([]);
  const [campaignCtx, setCampaignCtx] = useState<{
    loading: boolean;
    ad_account_id: string | null;
    campaigns: CampaignDTO[];
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
        setAccounts(data.adaccounts.map(({ adaccount }: any) => adaccount as AdAccountDTO));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        alert(error.message);
      });
  }, []);

  useEffect(() => {
    if (campaignCtx.ad_account_id) {
      setCampaignCtx((pre) => ({ ...pre, loading: true }));

      fetch(`/api/adaccounts/${campaignCtx.ad_account_id}/campaigns`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          const campaigns = data.campaigns.map(({ campaign }: any) => campaign as CampaignDTO);
          setCampaignCtx((pre) => ({ ...pre, campaigns, loading: false }));
        })
        .catch((error) => {
          setCampaignCtx((pre) => ({ ...pre, campaigns: [], loading: false }));
        });
    }
  }, [campaignCtx.ad_account_id]);

  const onViewCampaign = (ad_account_id: string): void => {
    setCampaignCtx((pre) => ({ ...pre, ad_account_id }));
  };

  const columns: Column<AdAccountDTO>[] = useMemo(
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
      {
        Header: 'Created At',
        accessor: 'created_at',
        sortType: 'basic',
        Cell: ({ value }) => DateTime.fromISO(value).toFormat('ff'),
      },
      {
        Header: 'Updated At',
        accessor: 'updated_at',
        sortType: 'basic',
        Cell: ({ value }) => DateTime.fromISO(value).toFormat('ff'),
      },
      { Header: 'Currency', accessor: 'currency', Cell: ({ value }) => <div className="badge">{value}</div> },
      { Header: 'Timezone', accessor: 'timezone' },
      {
        Header: 'Campaigns',
        Cell: ({ row: { original } }: { row: { original: AdAccountDTO } }) => {
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
    ],
    [],
  );

  const { renderTable, selectedFlatRows } = useTable({
    columns,
    data: accounts,
  });

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
      <div className="w-full">{renderTable()}</div>
      <CampaignModal modalID={campaignCtx.modalID} campaigns={campaignCtx.campaigns} loading={campaignCtx.loading} />
    </Layout>
  );
}
