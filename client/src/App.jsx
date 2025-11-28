import React, { useState, useEffect } from "react";

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

async function graphQLRequest(query, variables = {}, token = null) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "GraphQL error");
  }
  return json.data;
}

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        role
      }
    }
  }
`;

const EMPLOYEES_QUERY = `
  query Employees($page: Int!, $pageSize: Int!) {
    employees(page: $page, pageSize: $pageSize) {
      totalCount
      page
      pageSize
      items {
        id
        name
        age
        className
        subjects
        attendance
        flagged
      }
    }
  }
`;

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const [isTileView, setTileView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch employees whenever token changes (after login)
  useEffect(() => {
    if (!token) return;

    async function fetchEmployees() {
      try {
        setLoadingEmployees(true);
        setEmployeesError(null);
        const data = await graphQLRequest(
          EMPLOYEES_QUERY,
          { page: 1, pageSize: 10 },
          token
        );
        setEmployees(data.employees.items || []);
      } catch (err) {
        setEmployeesError(err.message);
      } finally {
        setLoadingEmployees(false);
      }
    }

    fetchEmployees();
  }, [token]);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      const data = await graphQLRequest(LOGIN_MUTATION, {
        username: loginForm.username,
        password: loginForm.password,
      });

      const userToken = data.login.token;
      localStorage.setItem("token", userToken);
      setToken(userToken);
    } catch (err) {
      alert("Invalid username or password! \n" + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setEmployees([]);
  };

  /* ------------------ LOGIN UI ------------------ */
  if (!token) {
    return (
      <div className="login-container">
        <h2>Login</h2>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />

          <button type="submit" disabled={loggingIn}>
            {loggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  /* ------------------ MAIN UI ------------------ */

  return (
  <div className="app-container">
    {/* NAVBAR */}
    <nav className="navbar">
      <div
        className="menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        ☰
      </div>
      <h1>Employee Dashboard</h1>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>

    {/* HORIZONTAL TOP MENU (tabs) */}
    <div className="top-tabs">
      <button className="tab active">Overview</button>
      <button className="tab">Attendance</button>
      <button className="tab">Performance</button>
    </div>

    {/* HAMBURGER SIDE MENU – one-level submenu */}
    {isMenuOpen && (
      <div className="side-menu">
        <ul>
          <li>Dashboard</li>
          <li>
            Employees
            <ul className="submenu">
              <li>All Employees</li>
              <li>Top Performers</li>
            </ul>
          </li>
          <li>Reports</li>
        </ul>
      </div>
    )}

      {/* VIEW TOGGLE */}
      <div className="view-toggle">
        <button
          className={!isTileView ? "active" : ""}
          onClick={() => setTileView(false)}
        >
          Grid View
        </button>
        <button
          className={isTileView ? "active" : ""}
          onClick={() => setTileView(true)}
        >
          Tile View
        </button>
      </div>

      {/* ERRORS / LOADING */}
      {loadingEmployees && (
        <div className="loading">Loading employees...</div>
      )}
      {employeesError && <div className="error">{employeesError}</div>}

      {/* GRID VIEW */}
      {/* GRID VIEW */}
{!isTileView && employees.length > 0 && (
  <table className="grid-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Age</th>
        <th>Class</th>
        <th>Subjects</th>
        <th>Primary Subject</th>
        <th>Attendance</th>
        <th>Attendance Band</th>
        <th>Role</th>
        <th>Flagged</th>
      </tr>
    </thead>
    <tbody>
      {employees.map((emp) => {
        const primarySubject = emp.subjects?.[0] || "-";
        const band =
          emp.attendance >= 90
            ? "Excellent"
            : emp.attendance >= 80
            ? "Good"
            : "Needs Attention";
        const roleLabel = emp.attendance >= 90 ? "Scholar" : "Student";

        return (
          <tr key={emp.id}>
            <td>{emp.id}</td>
            <td>{emp.name}</td>
            <td>{emp.age}</td>
            <td>{emp.className}</td>
            <td>{emp.subjects.join(", ")}</td>
            <td>{primarySubject}</td>
            <td>{emp.attendance}%</td>
            <td>{band}</td>
            <td>{roleLabel}</td>
            <td>{emp.flagged ? "Yes" : "No"}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
)}


      {/* TILE VIEW */}
{isTileView && (
  <div className="tile-container">
    {employees.map((emp) => (
      <div
        key={emp.id}
        className="tile"
        onClick={() => setSelectedEmployee(emp)}
      >
        <h3>{emp.name}</h3>
        <p>Age: {emp.age}</p>
        <p>Class: {emp.className}</p>

        {/* buttons par click se tile ka onClick trigger na ho */}
        <div
          className="tile-buttons"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => setSelectedEmployee(emp)}>View</button>
          <button onClick={() => alert("Edit not implemented")}>Edit</button>
          <button onClick={() => alert("Flag not implemented")}>Flag</button>
          <button onClick={() => alert("Delete not implemented")}>Delete</button>
        </div>
      </div>
    ))}
  </div>
)}


      {/* DETAIL MODAL */}
      {selectedEmployee && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedEmployee.name}</h2>
            <p>
              <strong>Age:</strong> {selectedEmployee.age}
            </p>
            <p>
              <strong>Class:</strong> {selectedEmployee.className}
            </p>
            <p>
              <strong>Subjects:</strong>{" "}
              {selectedEmployee.subjects.join(", ")}
            </p>
            <p>
              <strong>Attendance:</strong> {selectedEmployee.attendance}%
            </p>
            <p>
              <strong>Flagged:</strong>{" "}
              {selectedEmployee.flagged ? "Yes" : "No"}
            </p>

            <button
              onClick={() => setSelectedEmployee(null)}
              className="close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
