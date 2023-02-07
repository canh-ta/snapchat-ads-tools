import _ from 'lodash';
import PromisePool from '@supercharge/promise-pool';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Column } from 'react-table';
import Layout from '@components/Layout';
import AccessDenied from '@components/AccessDenied';
import { AdAccountDTO } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import { Organization } from '@models/Organization';
import { BillingCenter } from '@models/BillingCenter';
import { FundingSource } from '@models/FundingSource';
import { AdAccountCreateDTO } from '@models/AdAccount';
import { EStatus } from '@models/enums';

interface AdAccountWithNew extends AdAccountDTO {
  isNew: boolean;
}

export default function AdAccountsPage() {
  const { data: session } = useSession();
  const [isLoading, setLoading] = useState(false);
  const [isAccLoading, setAccLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccountWithNew[]>([]);
  const [errors, setErrors] = useState<String[]>([]);
  const [billingCenters, setBillingCenters] = useState<BillingCenter[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [organizationID, setOrganizationID] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [synchronously, setSynchronously] = useState<'sync' | 'async'>('sync');
  const [parallel, setParallel] = useState<number>(5);
  const [accNumber, setAccNumber] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/organizations`)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then((data) => {
        const orgs = _.get(data, 'organizations', []);
        setOrganizations(orgs.map(({ organization }: any) => organization));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        alert(error.message);
      });
  }, []);

  useEffect(() => {
    if (organizationID) {
      setAccLoading(true);
      fetch(`/api/organizations/${organizationID}/adaccounts`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          setAccounts(
            data.adaccounts.map(({ adaccount }: { adaccount: AdAccountDTO }) => ({ ...adaccount, isNew: false })),
          );
          setAccLoading(false);
        })
        .catch((error) => {
          setAccLoading(false);
          alert(error.message);
        });

      fetch(`/api/organizations/${organizationID}/billingcenters`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          setBillingCenters(data.billingcenters.map(({ billingcenter }: any) => billingcenter));
        })
        .catch((error) => {
          alert(error.message);
        });

      fetch(`/api/organizations/${organizationID}/fundingsources`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          setFundingSources(data.fundingsources.map(({ fundingsource }: any) => fundingsource));
        })
        .catch((error) => {
          alert(error.message);
        });
    }
  }, [organizationID]);

  const columns: Column<AdAccountWithNew>[] = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', sortType: 'basic' },
      {
        Header: 'State',
        accessor: 'isNew',
        sortType: 'basic',
        Cell: ({ value }) => (value ? <div className="badge badge-outline badge-success">NEW</div> : <></>),
      },
      { Header: 'ID', accessor: 'id', sortType: 'basic' },
      { Header: 'Type', accessor: 'type', sortType: 'basic' },
      {
        Header: 'Status',
        accessor: 'status',
        sortType: 'basic',
        Cell: ({ value }) => (
          <div className={`badge badge-outline ${value === 'ACTIVE' ? 'badge-success' : ''}`}>{value}</div>
        ),
      },
    ],
    [],
  );

  const createAccount = useCallback(
    async (payload: AdAccountCreateDTO): Promise<void> => {
      const JSONdata = JSON.stringify(payload);
      const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
      const response = await fetch(`/api/organizations/${organizationID}/adaccounts`, options);
      const result = await response.json();
      const newAccount: AdAccountDTO | null = _.get(result, 'adaccounts[0].adaccount', null);

      if (newAccount) {
        setAccounts((pre) => [...pre, { ...newAccount, isNew: true }]);
      } else {
        const err = _.get(result, 'adaccounts[0].sub_request_error_reason') || 'Create account failed';
        console.log(payload.name, err);
        setErrors((pre) => [...pre, err]);
      }
    },
    [organizationID],
  );

  const onSelectOrg = (event: any) => {
    setOrganizationID(event.target.value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const maximumNumber = 200 - accounts.length;

    if (accNumber > maximumNumber) {
      alert(`You can create ${maximumNumber} more ad accounts at this time`);
      return;
    }

    const name_prefix: string = event.target.name_prefix.value;
    const type = event.target.type.value;
    const status: EStatus = event.target.status.value;
    const organization_id = event.target.organization_id.value;
    const billing_type = event.target.billing_type.value;
    const billing_center_id = event.target.billing_center_id.value;
    const funding_source_id = event.target.funding_source_id.value;
    const currency = event.target.currency.value;
    const timezone = event.target.timezone.value;

    // TOD: Validate the form inputs
    if (accNumber === 0) {
      return;
    }

    const accountNames = Array.from({ length: accNumber }, (_, index) => `${name_prefix} ${index}`);
    const selectedOrg: Organization = organizations.filter((org: Organization) => org.id === organization_id)[0];

    let payload: AdAccountCreateDTO = {
      name: '',
      type,
      status,
      advertiser: selectedOrg?.name || 'Advertiser name',
      organization_id,
      billing_type,
      billing_center_id,
      funding_source_ids: [funding_source_id],
      currency,
      timezone,
      agency_representing_client: false,
      client_paying_invoices: false,
    };

    if (synchronously === 'sync') {
      for await (const name of accountNames) {
        await createAccount({ ...payload, name });
      }
    } else {
      await PromisePool.withConcurrency(parallel)
        .for(accountNames)
        .process(async (name: any) => {
          await createAccount({ ...payload, name });
        });
    }
  };

  const { renderTable } = useTable({
    columns,
    data: accounts,
  });

  const onSyncChange = (event: any) => {
    setSynchronously(event.target.value);
  };

  const onBatchChange = (event: any) => {
    setParallel(Number(event.target.value));
  };

  const onNumberChange = (event: any) => {
    setAccNumber(Number(event.target.value));
  };

  const selectedOrgName = useMemo(() => {
    const selectOrg: any = organizations.find((org: any) => org.id === organizationID);
    return selectOrg?.name || '';
  }, [organizationID, organizations]);

  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }
  const FormSection = (
    <div className="bg-gray-300 gap-2 p-4 rounded-lg">
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col col-span-2">
          <label className="label">
            <span className="label-text">Account name prefix</span>
            <span className="label-text-alt text-orange-500">* Required</span>
          </label>
          <input
            type="text"
            id="name_prefix"
            placeholder="E.g Abc => Abc 1, Abc 2, etc."
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Account type</span>
          <select className="select select-bordered select-sm" id="type">
            <option value="PARTNER">PARTNER</option>
            <option value="DIRECT">DIRECT</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Account status</span>
          <select className="select select-bordered select-sm" id="status">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </div>

        <div className="flex flex-col">
          <span className="label label-text">Advertising organization</span>
          <select className="select select-bordered select-sm" id="organization_id">
            {organizations.map((org: Organization) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Billing Type</span>
          <select className="select select-bordered select-sm" id="billing_type">
            <option value="REVOLVING">Revolving</option>
            <option value="IO">Insertion Order</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="label">
            <span className="label-text">Billing Center</span>
            <span className="label-text-alt text-orange-500">* Required</span>
          </label>
          <select className="select select-bordered select-sm" id="billing_center_id">
            {billingCenters.map((bc: BillingCenter) => (
              <option key={bc.id} value={bc.id}>
                {bc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="label">
            <span className="label-text">Founding source</span>
            <span className="label-text-alt text-orange-500">* Required</span>
          </label>
          <select className="select select-bordered select-sm" id="funding_source_id">
            {fundingSources.map((fs: FundingSource) => (
              <option key={fs.id} value={fs.id}>
                {`[${fs.card_type}] [**** ${fs.last_4}] ${fs.name}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Currency</span>
          <select className="select select-bordered select-sm" id="currency">
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Time Zone</span>
          <select className="select select-bordered select-sm" id="timezone">
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="America/New_York">America/New_York</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );

  const ConfigSection = (
    <div className="bg-gray-300 p-4 rounded-lg">
      <div className="flex justify-between gap-4">
        <label className="flex items-center gap-2">
          <span className="label label-text">Create</span>
          <input type="number" value={accNumber} onChange={onNumberChange} className="input input-bordered input-sm" />
          <span>new accounts</span>
          <select
            value={synchronously as any}
            onChange={onSyncChange}
            disabled={!organizationID}
            className="select select-sm"
          >
            <option value="sync">sequentially</option>
            <option value="async">parallel</option>
          </select>
        </label>
        {synchronously === 'async' && (
          <label className="cursor-pointer flex items-center gap-2 justify-left select-none">
            <span className="label-text">Processes</span>
            <input type="number" value={parallel} onChange={onBatchChange} className="input input-bordered input-sm" />
            <span className="label-text">items in parallel.</span>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex border border-base-300 rounded-box items-center justify-between gap-4 p-4 m-4">
        <div className="text-xl">
          {isLoading
            ? 'Loading...'
            : organizationID
            ? `Org ${selectedOrgName} has ${accounts.length} accounts.`
            : 'Please select your organization'}
        </div>
        <select
          value={organizationID}
          onChange={onSelectOrg}
          disabled={organizations.length === 0}
          className="select select-bordered w-full max-w-xs"
        >
          <option value="">Select organization</option>
          {organizations.map((organization: any) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </div>
      <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box m-4">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title text-xl font-medium">Configuration</div>
        <div className="collapse-content">{ConfigSection}</div>
      </div>
      {organizationID?.length > 0 && (
        <div className="flex flex-col gap-4 m-4">
          <form noValidate className="form-control" onSubmit={handleSubmit}>
            <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title text-xl font-medium">Account Details</div>
              <div className="collapse-content">{FormSection}</div>
            </div>
            <div className="flex mt-4">
              <button className="btn btn-active btn-primary" type="submit">
                {`Create ${accNumber} new accounts`}
              </button>
            </div>
          </form>
          <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title text-xl font-medium">All accounts</div>
            <div className="collapse-content">
              {isAccLoading ? <div className="text-2xl p-4">Loading ad accounts...</div> : renderTable()}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
