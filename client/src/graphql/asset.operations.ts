import { gql } from "@apollo/client";

export const GET_ASSETS = gql`
  query GetAssets {
    assets {
      _id
      name
      serialNumber
      note
      price
      type
      radioSubtype
      unit {
        _id
        name
      }
    }
  }
`;

export const GET_ASSETS_PAGE = gql`
  query GetAssetsPage(
    $page: Int
    $limit: Int
    $unitId: ID
    $search: String
  ) {
    assetsPage(
      page: $page
      limit: $limit
      unitId: $unitId
      search: $search
    ) {
      items {
        _id
        name
        serialNumber
        note
        price
        type
        radioSubtype
        unit {
          _id
          name
        }
      }
      total
      totalPrice
      page
      limit
      totalPages
    }
  }
`;

export const GET_ASSET = gql`
  query GetAsset($id: ID!) {
    asset(id: $id) {
      _id
      name
      serialNumber
      note
      price
      type
      radioSubtype
      unit {
        _id
        name
      }
    }
  }
`;

export const GET_ASSET_DASHBOARD_SUMMARY = gql`
  query GetAssetDashboardSummary {
    assetDashboardSummary {
      total
      starlinkCount
      laptopCount
      radioCount
      otherCount
      byType {
        type
        count
      }
      radioBySubtype {
        subtype
        count
      }
      byUnit {
        unit {
          _id
          name
        }
        total
        starlinkCount
        laptopCount
        radioCount
        otherCount
        radioBySubtype {
          subtype
          count
        }
      }
    }
  }
`;

export const CREATE_ASSET = gql`
  mutation CreateAsset(
    $name: String!
    $serialNumber: String!
    $note: String
    $price: Float!
    $type: AssetType!
    $radioSubtype: RadioSubtype
    $unitId: ID!
  ) {
    createAsset(
      name: $name
      serialNumber: $serialNumber
      note: $note
      price: $price
      type: $type
      radioSubtype: $radioSubtype
      unitId: $unitId
    ) {
      _id
      name
    }
  }
`;

export const UPDATE_ASSET = gql`
  mutation UpdateAsset(
    $id: ID!
    $name: String
    $serialNumber: String
    $note: String
    $price: Float
    $type: AssetType
    $radioSubtype: RadioSubtype
    $unitId: ID
  ) {
    updateAsset(
      id: $id
      name: $name
      serialNumber: $serialNumber
      note: $note
      price: $price
      type: $type
      radioSubtype: $radioSubtype
      unitId: $unitId
    ) {
      _id
      name
    }
  }
`;

export const DELETE_ASSET = gql`
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id)
  }
`;
