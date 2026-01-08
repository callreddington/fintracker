import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';
import DebugPage from '@/pages/debug';
import DashboardPage from '@/pages/dashboard';
import TransactionsPage from '@/pages/transactions';
import AccountsPage from '@/pages/accounts';
import IncomePage from '@/pages/income';
import ExpensesPage from '@/pages/expenses';
import BudgetsPage from '@/pages/budgets';
import GoalsPage from '@/pages/goals';
import PortfolioPage from '@/pages/portfolio';
import InsightsPage from '@/pages/insights';
import SettingsPage from '@/pages/settings';
import CalculatorPage from '@/pages/calculator';

// Layout & Auth
import MainLayout from '@/components/layout/main-layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fintracker-ui-theme">
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/debug" element={<DebugPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/bills" element={<div>Bill Reminders (Coming Soon)</div>} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/mpesa" element={<div>M-Pesa Parser (Coming Soon)</div>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
