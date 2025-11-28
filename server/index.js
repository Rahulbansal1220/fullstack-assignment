// index.js - Single-file GraphQL + Express server

const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ---- Config ----
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-key';

// ---- In-memory Data ----
const users = [
  { id: '1', username: 'admin', password: 'admin123', role: 'ADMIN' },
  { id: '2', username: 'john', password: 'john123', role: 'EMPLOYEE' },
];

let employees = [
  {
    id: 'e1',
    name: 'Alice Johnson',
    age: 29,
    className: 'Class A',
    subjects: ['Math', 'Science'],
    attendance: 96,
    flagged: false,
    createdAt: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'e2',
    name: 'Bob Singh',
    age: 34,
    className: 'Class B',
    subjects: ['English', 'History'],
    attendance: 89,
    flagged: true,
    createdAt: new Date('2024-03-01').toISOString(),
  },
  {
    id: 'e3',
    name: 'Clara Lee',
    age: 26,
    className: 'Class A',
    subjects: ['Biology', 'Chemistry'],
    attendance: 92,
    flagged: false,
    createdAt: new Date('2024-05-21').toISOString(),
  },
];

// ---- GraphQL Schema ----
const typeDefs = gql`
  enum Role {
    ADMIN
    EMPLOYEE
  }

  type User {
    id: ID!
    username: String!
    role: Role!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Employee {
    id: ID!
    name: String!
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    flagged: Boolean!
    createdAt: String!
  }

  input EmployeeFilter {
    nameContains: String
    className: String
    minAttendance: Int
  }

  enum EmployeeSortField {
    NAME
    AGE
    ATTENDANCE
    CREATED_AT
  }

  enum SortOrder {
    ASC
    DESC
  }

  input EmployeeSort {
    field: EmployeeSortField!
    order: SortOrder! = ASC
  }

  input EmployeeInput {
    name: String!
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    flagged: Boolean
  }

  type EmployeePage {
    items: [Employee!]!
    totalCount: Int!
    page: Int!
    pageSize: Int!
  }

  type Query {
    me: User

    employees(
      filter: EmployeeFilter
      page: Int = 1
      pageSize: Int = 10
      sort: EmployeeSort
    ): EmployeePage!

    employee(id: ID!): Employee
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!

    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
  }
`;

// ---- Helpers ----
function requireAuth(context) {
  if (!context.user) {
    throw new Error('Not authenticated');
  }
}

function requireRole(context, roles) {
  requireAuth(context);
  if (!roles.includes(context.user.role)) {
    throw new Error('Not authorized');
  }
}

function sortEmployees(list, sort) {
  if (!sort) return list;

  const { field, order } = sort;
  const dir = order === 'DESC' ? -1 : 1;

  return [...list].sort((a, b) => {
    let av, bv;
    switch (field) {
      case 'NAME':
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case 'AGE':
        av = a.age;
        bv = b.age;
        break;
      case 'ATTENDANCE':
        av = a.attendance;
        bv = b.attendance;
        break;
      case 'CREATED_AT':
        av = a.createdAt;
        bv = b.createdAt;
        break;
      default:
        av = 0;
        bv = 0;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function filterEmployees(list, filter) {
  if (!filter) return list;

  let result = [...list];

  if (filter.nameContains) {
    const q = filter.nameContains.toLowerCase();
    result = result.filter((e) => e.name.toLowerCase().includes(q));
  }

  if (filter.className) {
    result = result.filter((e) => e.className === filter.className);
  }

  if (typeof filter.minAttendance === 'number') {
    result = result.filter((e) => e.attendance >= filter.minAttendance);
  }

  return result;
}

// ---- Resolvers ----
const resolvers = {
  Query: {
    me: (_, __, { user }) => user || null,

    employees: (_, args) => {
      const { filter, page = 1, pageSize = 10, sort } = args;

      let list = filterEmployees(employees, filter);
      list = sortEmployees(list, sort);

      const totalCount = list.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const items = list.slice(start, end);

      return {
        items,
        totalCount,
        page,
        pageSize,
      };
    },

    employee: (_, { id }) => employees.find((e) => e.id === id) || null,
  },

  Mutation: {
    login: (_, { username, password }) => {
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    },

    addEmployee: (_, { input }, context) => {
      requireRole(context, ['ADMIN']);
      const id = `e${employees.length + 1}`;
      const now = new Date().toISOString();

      const employee = {
        id,
        name: input.name,
        age: input.age,
        className: input.className,
        subjects: input.subjects,
        attendance: input.attendance,
        flagged: input.flagged ?? false,
        createdAt: now,
      };

      employees.push(employee);
      return employee;
    },

    updateEmployee: (_, { id, input }, context) => {
      requireRole(context, ['ADMIN']);
      const idx = employees.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Employee not found');

      employees[idx] = {
        ...employees[idx],
        ...input,
      };

      return employees[idx];
    },
  },
};

// ---- Context (Auth) ----
async function createContext({ req }) {
  const auth = req.headers.authorization || '';
  let user = null;

  if (auth.startsWith('Bearer ')) {
    const token = auth.replace('Bearer ', '');
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.warn('Invalid token');
    }
  }

  return { user };
}

// ---- Start Server ----
async function startServer() {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    cache: 'bounded',
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.get('/', (req, res) => {
    res.send('GraphQL API running. Go to /graphql');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
