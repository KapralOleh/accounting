export const typeDefs = `#graphql
  enum AssetType {
    PRINTER
    LAPTOP
    STARLINK
    TABLET
    RADIO
    OTHER
  }

  enum RadioSubtype {
    DP4400
    DP4800
    R7
    R7a
    DM4600
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
    radioSubtype: RadioSubtype
    unit: Unit!
    createdAt: String
    updatedAt: String
  }

  type AssetPage {
    items: [Asset!]!
    total: Int!
    totalPrice: Float!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type AssetTypeCount {
    type: AssetType!
    count: Int!
  }

  type RadioSubtypeCount {
    subtype: RadioSubtype!
    count: Int!
  }

  type AssetDashboardSummary {
    total: Int!
    starlinkCount: Int!
    laptopCount: Int!
    radioCount: Int!
    otherCount: Int!
    byType: [AssetTypeCount!]!
    radioBySubtype: [RadioSubtypeCount!]!
    byUnit: [UnitDashboardSummary!]!
  }

  type UnitDashboardSummary {
    unit: Unit!
    total: Int!
    starlinkCount: Int!
    laptopCount: Int!
    radioCount: Int!
    otherCount: Int!
    radioBySubtype: [RadioSubtypeCount!]!
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
    assetsPage(page: Int, limit: Int, unitId: ID, search: String): AssetPage!
    assetDashboardSummary: AssetDashboardSummary!
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
      radioSubtype: RadioSubtype
      unitId: ID!
    ): Asset!

    updateAsset(
      id: ID!
      name: String
      serialNumber: String
      note: String
      price: Float
      type: AssetType
      radioSubtype: RadioSubtype
      unitId: ID
    ): Asset!

    deleteAsset(id: ID!): Boolean!
  }
`;
