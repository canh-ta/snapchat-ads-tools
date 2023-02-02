import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
const { DateTime } = require('luxon');
import { Column } from 'react-table';
import Layout from '@components/layout';
import AccessDenied from '@components/access-denied';
import { AdAccount } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import themes from '@configs/theme';

const organization_id = 'b16eb6ba-1631-40cc-8317-ac46933690b5';

export default function AdAccountsPage() {
  const { data: session } = useSession();
  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const columns: Column<AdAccount>[] = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', sortType: 'basic' },
      { Header: 'Status', accessor: 'status', sortType: 'basic' },
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
      { Header: 'Currency', accessor: 'currency' },
      { Header: 'Timezone', accessor: 'timezone' },
    ],
    [],
  );

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
        setAccounts(data.adaccounts.map(({ adaccount }: any) => adaccount as AdAccount));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        alert(error.message);
      });
  }, []);

  const { renderTable, selectedFlatRows } = useTable({
    columns,
    data: accounts,
  });

  const onCreateCampaign = () => {
    alert(`Create campaign for ${selectedFlatRows.map((account: AdAccount) => account.name).join(', ')}`);
  };

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
      <hr />
      <div className="flex justify-between items-center m-2">
        <p>{`Selected: ${selectedFlatRows.map((account: AdAccount) => account.name).join(', ')}`}</p>
        <button className={themes.button.primary} onClick={onCreateCampaign}>
          Create Campaigns
        </button>
      </div>
      <div className="w-full">{renderTable()}</div>
    </Layout>
  );
}
