import Layout from "@/components/layout/layout";
import PageTitle from "@/components/pageTitle/pageTitle";
import TransactionHistoryContent from "@/components/transaction_history/transactionHistoryContent";
import { useTranslation } from "react-i18next";

export default function TransactionHistory() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="flex flex-col">
        <PageTitle title={t("transaction_history.title")} />
        <TransactionHistoryContent isHost={true} t={t} />
      </div>
    </Layout>
  );
}
