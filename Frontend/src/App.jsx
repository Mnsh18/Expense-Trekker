import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  // =========================
  // AUTH
  // =========================

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const [showRegister, setShowRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerMiddleName, setRegisterMiddleName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const [user, setUser] = useState(null);

  // =========================
  // TRANSACTIONS
  // =========================

  const [transactions, setTransactions] = useState([]);

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
  });

  const [expenseData, setExpenseData] = useState([]);

  // =========================
  // TRANSACTION FORM
  // =========================

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [editingId, setEditingId] = useState(null);

  // =========================
  // GET TOKEN
  // =========================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const meResponse = await fetch(
        "http://127.0.0.1:8000/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (meResponse.ok) {
        const meData = await meResponse.json();
        setUser(meData);
      }

      const transactionsResponse = await fetch(
        "http://127.0.0.1:8000/transactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transactionsData = await transactionsResponse.json();

      if (transactionsResponse.status === 401) {
        localStorage.removeItem("access_token");

        setIsLoggedIn(false);
        setTransactions([]);

        setSummary({
          total_income: 0,
          total_expenses: 0,
          balance: 0,
        });

        return;
      }

      if (!transactionsResponse.ok) {
        console.error(
          "Failed to fetch transactions:",
          transactionsData
        );

        return;
      }

      setTransactions(transactionsData);

      const summaryResponse = await fetch(
        "http://127.0.0.1:8000/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const summaryData = await summaryResponse.json();

      if (!summaryResponse.ok) {
        console.error(
          "Failed to fetch summary:",
          summaryData
        );

        return;
      }

      setSummary(summaryData);

      // =========================
      // LOAD EXPENSE ANALYTICS
      // =========================

      const analyticsResponse = await fetch(
        "http://127.0.0.1:8000/analytics/expenses-by-category",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const analyticsData = await analyticsResponse.json();

      if (!analyticsResponse.ok) {
        console.error(
          "Failed to fetch expense analytics:",
          analyticsData
        );

        return;
      }

      setExpenseData(analyticsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginMessage("Signing you in...");

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(
          data.detail || "Invalid email or password"
        );

        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      setIsLoggedIn(true);

      setEmail("");
      setPassword("");
      setLoginMessage("");

      await loadData();
    } catch (error) {
      console.error(error);

      setLoginMessage(
        "Unable to connect to the server"
      );
    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async (event) => {
    event.preventDefault();

    setRegisterMessage("");

    const firstName = registerFirstName.trim();
    const middleName = registerMiddleName.trim();
    const lastName = registerLastName.trim();
    const emailValue = registerEmail.trim();

    if (!firstName || !lastName) {
      setRegisterMessage("First name and last name are required.");
      return;
    }

    

    if (registerPassword !== confirmPassword) {
      setRegisterMessage("Passwords do not match.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterMessage("Password must be at least 6 characters.");
      return;
    }

    setRegisterLoading(true);
    setRegisterMessage("Creating your account...");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            email: emailValue,
            password: registerPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRegisterMessage(
          data.detail || "Registration failed."
        );
        return;
      }

      setRegisterFirstName("");
      setRegisterMiddleName("");
      setRegisterLastName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      setRegisterMessage(
        "Account created successfully! Please sign in."
      );

      setTimeout(() => {
        setShowRegister(false);
        setRegisterMessage("");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterMessage(
        "Unable to connect to the server."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  // =========================
  // ADD TRANSACTION
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            category: category,
            type: type,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to create transaction:",
          data
        );

        return;
      }

      await loadData();

      setAmount("");
      setCategory("");
      setType("expense");
    } catch (error) {
      console.error(
        "Error creating transaction:",
        error
      );
    }
  };

  // =========================
  // EDIT TRANSACTION
  // =========================

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setAmount(transaction.amount);
    setCategory(transaction.category);
    setType(transaction.type);
  };

  // =========================
  // UPDATE TRANSACTION
  // =========================

  const handleUpdate = async (event) => {
    event.preventDefault();

    const token = getToken();

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/transactions/${editingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            category: category,
            type: type,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to update transaction:",
          data
        );

        return;
      }

      await loadData();

      setEditingId(null);
      setAmount("");
      setCategory("");
      setType("expense");
    } catch (error) {
      console.error(
        "Error updating transaction:",
        error
      );
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setCategory("");
    setType("expense");
  };

  // =========================
  // DELETE TRANSACTION
  // =========================

  const handleDelete = async (transactionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/transactions/${transactionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to delete transaction:",
          data
        );

        return;
      }

      await loadData();
    } catch (error) {
      console.error(
        "Error deleting transaction:",
        error
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setIsLoggedIn(false);
    setUser(null);

    setTransactions([]);

    setSummary({
      total_income: 0,
      total_expenses: 0,
      balance: 0,
    });

    setAmount("");
    setCategory("");
    setType("expense");
    setEditingId(null);
  };

  // =========================
  // FORMAT TRANSACTION DATE
  // =========================

  const formatTransactionDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================
  // LOGIN / REGISTER PAGE
  // =========================

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="brand">
            <div className="brand-icon">
              ₹
            </div>

            <span>MoneyMate</span>
          </div>

          {!showRegister ? (
            <>
              <div className="login-heading">
                <h1>Welcome back</h1>

                <p>
                  Sign in to manage your finances.
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <label>Email</label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button
                  className="primary-button"
                  type="submit"
                >
                  Sign In
                </button>
              </form>

              {loginMessage && (
                <p className="login-message">
                  {loginMessage}
                </p>
              )}

              <div className="auth-switch">
  <span>Don't have an account? </span>

  <span
    className="text-button"
    role="button"
    tabIndex={0}
    onClick={() => {
      setShowRegister(true);
      setLoginMessage("");
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        setShowRegister(true);
        setLoginMessage("");
      }
    }}
  >
    Create Account
  </span>
</div>
            </>
          ) : (
            <>
              <div className="login-heading">
                <h1>Create your account</h1>

                <p>
                  Start managing your finances today.
                </p>
              </div>

              <form onSubmit={handleRegister}>
                <label>First Name</label>

                <input
                  type="text"
                  placeholder="First name"
                  value={registerFirstName}
                  onChange={(event) =>
                    setRegisterFirstName(event.target.value)
                  }
                  required
                />

                <label>Middle Name</label>

                <input
                  type="text"
                  placeholder="Middle name (optional)"
                  value={registerMiddleName}
                  onChange={(event) =>
                    setRegisterMiddleName(event.target.value)
                  }
                />

                <label>Last Name</label>

                <input
                  type="text"
                  placeholder="Last name"
                  value={registerLastName}
                  onChange={(event) =>
                    setRegisterLastName(event.target.value)
                  }
                  required
                />

                <label>Email</label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(event) =>
                    setRegisterEmail(
                      event.target.value
                    )
                  }
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(event) =>
                    setRegisterPassword(
                      event.target.value
                    )
                  }
                  required
                />

                <label>Confirm Password</label>

                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                />

                <button
                  className="primary-button"
                  type="submit"
                  disabled={registerLoading}
                >
                  {registerLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              {registerMessage && (
                <p className="login-message">
                  {registerMessage}
                </p>
              )}

              <p className="auth-switch">
                Already have an account?{" "}

                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterMessage("");
                  }}
                >
                  Sign In
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  const fullName = [
    user?.first_name,
    user?.middle_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="dashboard">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            ₹
          </div>

          <span>MoneyMate</span>
        </div>

        <nav>
          <div className="nav-item active">
            <span>⌂</span>
            Dashboard
          </div>

          <div className="nav-item">
            <span>↕</span>
            Transactions
          </div>
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          ⇥ Logout
        </button>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="eyebrow">
              PERSONAL FINANCE
            </p>

            <h1>
              Welcome, {fullName || "there"}!
            </h1>

            <p className="subtitle">
              Keep track of where your money goes.
            </p>
          </div>

          <div className="user-avatar">
            {user?.first_name
              ? `${user.first_name.charAt(0)}${
                  user.last_name
                    ? user.last_name.charAt(0)
                    : ""
                }`.toUpperCase()
              : "U"}
          </div>

        </header>

        <section className="summary-grid">

          <div className="summary-card balance-card">

            <div className="card-header">
              <span>
                Current Balance
              </span>

              <span className="card-icon">
                ₹
              </span>
            </div>

            <h2>
              ₹
              {Number(
                summary.balance
              ).toLocaleString()}
            </h2>

            <p>
              Income minus expenses
            </p>

          </div>

          <div className="summary-card income-card">

            <div className="card-header">
              <span>
                Total Income
              </span>

              <span className="card-icon">
                ↗
              </span>
            </div>

            <h2>
              ₹
              {Number(
                summary.total_income
              ).toLocaleString()}
            </h2>

            <p>
              Money coming in
            </p>

          </div>

          <div className="summary-card expense-card">

            <div className="card-header">
              <span>
                Total Expenses
              </span>

              <span className="card-icon">
                ↘
              </span>
            </div>

            <h2>
              ₹
              {Number(
                summary.total_expenses
              ).toLocaleString()}
            </h2>

            <p>
              Money going out
            </p>

          </div>

        </section>

        {/* EXPENSE ANALYTICS */}

        <section className="panel analytics-panel" style={{ marginTop: "24px" }}>

          <div className="panel-heading">
            <div>
              <h2>Expense Breakdown</h2>
              <p>See where your recorded expenses are going.</p>
            </div>
          </div>

          {expenseData.length === 0 ? (
            <div className="empty-state">
              <h3>No expense data yet</h3>
              <p>Add an expense to see the breakdown.</p>
            </div>
          ) : (
            <div style={{ width: "100%", height: "360px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {expenseData.map((entry, index) => {
                      const chartColors = [
                        "#6366f1",
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444",
                        "#06b6d4",
                        "#a855f7",
                        "#ec4899",
                        "#14b8a6",
                      ];

                      return (
                        <Cell
                          key={`cell-${entry.category}-${index}`}
                          fill={
                            chartColors[
                              index % chartColors.length
                            ]
                          }
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

        </section>

        <section className="content-grid">

          <div className="panel transaction-form-panel">

            <div className="panel-heading">
              <div>

                <h2>
                  {editingId === null
                    ? "Add Transaction"
                    : "Edit Transaction"}
                </h2>

                <p>
                  {editingId === null
                    ? "Record your income or expense."
                    : "Update this transaction."}
                </p>

              </div>
            </div>

            <form
              className="transaction-form"
              onSubmit={
                editingId === null
                  ? handleSubmit
                  : handleUpdate
              }
            >

              <div className="input-group">

                <label>
                  Amount
                </label>

                <div className="amount-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <div className="input-group">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  placeholder="e.g. Food, Salary, Travel"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              <div className="input-group">

                <label>
                  Type
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value
                    )
                  }
                >

                  <option value="expense">
                    Expense
                  </option>

                  <option value="income">
                    Income
                  </option>

                </select>

              </div>

              <div className="form-buttons">

                <button
                  className="primary-button"
                  type="submit"
                >
                  {editingId === null
                    ? "+ Add Transaction"
                    : "✓ Update Transaction"}
                </button>

                {editingId !== null && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={
                      handleCancelEdit
                    }
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

          </div>

          <div className="panel transactions-panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Recent Transactions
                </h2>

                <p>
                  Your latest financial activity.
                </p>

              </div>

              <span className="transaction-count">
                {transactions.length}
              </span>

            </div>

            {transactions.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ₹
                </div>

                <h3>
                  No transactions yet
                </h3>

                <p>
                  Add your first transaction
                  to get started.
                </p>

              </div>

            ) : (

              <div className="transaction-list">

                {transactions.map(
                  (transaction) => (

                    <div
                      className="transaction-row"
                      key={transaction.id}
                    >

                      <div className="transaction-info">

                        <div
                          className={`transaction-icon ${
                            transaction.type ===
                            "income"
                              ? "income-icon"
                              : "expense-icon"
                          }`}
                        >
                          {transaction.type ===
                          "income"
                            ? "↗"
                            : "↘"}
                        </div>

                        <div>

                          <h3>
                            {transaction.category}
                          </h3>

                          <p>
                            {transaction.type ===
                            "income"
                              ? "Income"
                              : "Expense"}
                          </p>

                          {/* AUTOMATIC TRANSACTION DATE */}
                          <small className="transaction-date">
                            {formatTransactionDate(
                              transaction.created_at
                            )}
                          </small>

                        </div>

                      </div>

                      <div className="transaction-actions">

                        <strong
                          className={
                            transaction.type ===
                            "income"
                              ? "income-text"
                              : "expense-text"
                          }
                        >
                          {transaction.type ===
                          "income"
                            ? "+"
                            : "-"}
                          ₹
                          {Number(
                            transaction.amount
                          ).toLocaleString()}
                        </strong>

                        <button
                          className="icon-button"
                          onClick={() =>
                            handleEdit(
                              transaction
                            )
                          }
                          title="Edit"
                        >
                          ✎
                        </button>

                        <button
                          className="icon-button delete"
                          onClick={() =>
                            handleDelete(
                              transaction.id
                            )
                          }
                          title="Delete"
                        >
                          ×
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;