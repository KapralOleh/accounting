export const typeDefs = `#graphql
  enum AssetType {
    PRINTER
    LAPTOP
    MONITOR
    PHONE
    TABLET
    OTHER
  }

  type User {
    _id: ID!
    name: String!
    email: String!
  }

  type Unit {
    _id: ID!
    name: String!
    createdAt: String
    updatedAt: String
  }

  type Asset {
    _id: ID!
    name: String!
    serialNumber: String!
    note: String
    price: Float!
    type: AssetType!
    unit: Unit!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User

    units: [Unit!]!
    unit(id: ID!): Unit

    assets: [Asset!]!
    asset(id: ID!): Asset
    assetsByUnit(unitId: ID!): [Asset!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createUnit(name: String!): Unit!
    updateUnit(id: ID!, name: String!): Unit!
    deleteUnit(id: ID!): Boolean!

    createAsset(
      name: String!
      serialNumber: String!
      note: String
      price: Float!
      type: AssetType!
      unitId: ID!
    ): Asset!

    updateAsset(
      id: ID!
      name: String
      serialNumber: String
      note: String
      price: Float
      type: AssetType
      unitId: ID
    ): Asset!

    deleteAsset(id: ID!): Boolean!
  }
`;