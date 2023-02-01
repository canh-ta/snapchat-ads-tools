import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Layout from "../../components/layout";
import AccessDenied from "../../components/access-denied";
import { AdAccount } from "@/models/AdAccount";
import styles from "./adaccounts.module.css";

export default function ProtectedPage() {
  const { data: session } = useSession();
  const [orgID, setOrgID] = useState("b16eb6ba-1631-40cc-8317-ac46933690b5");
  const [accounts, setAccounts] = useState<AdAccount[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/organizations/${orgID}/adaccounts`);
      const response = await res.json();
      if (response?.adaccounts) {
        setAccounts(
          response.adaccounts.map(
            ({ adaccount }: any) => adaccount as AdAccount
          )
        );
      }
    };
    if (session) {
      fetchData();
    }
  }, [orgID, session]);

  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  return (
    <Layout>
      <h1>Ad Accounts</h1>
      <p>Organizations ID: {orgID}</p>
      <p>Totals: {accounts.length}</p>
      <table className={styles.table}>
        <tr>
          <th className={styles.th}>No.</th>
          <th className={styles.th}>ID</th>
          <th className={styles.th}>Name</th>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Created At</th>
          <th className={styles.th}>Updated At</th>
          <th className={styles.th}>Currency</th>
          <th className={styles.th}>timezone</th>
        </tr>
        {accounts.map((account, index) => (
          <tr key={account.id}>
            <td className={styles.td}>{index + 1}</td>
            <td className={styles.td}>{account.id}</td>
            <td className={styles.td}>{account.name}</td>
            <td className={styles.td}>{account.status}</td>
            <td className={styles.td}>{account.created_at}</td>
            <td className={styles.td}>{account.updated_at}</td>
            <td className={styles.td}>{account.currency}</td>
            <td className={styles.td}>{account.timezone}</td>
          </tr>
        ))}
      </table>
    </Layout>
  );
}
