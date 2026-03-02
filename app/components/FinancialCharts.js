import BalanceSheetChart from './BalanceSheetChart';
import IncomeStatementChart from './IncomeStatementChart';

export default function FinancialCharts({ list }) {
  if (!list || list.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
        <BalanceSheetChart list={list} />
      </div>
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
        <IncomeStatementChart list={list} />
      </div>
    </div>
  );
}
