import { gql } from "@apollo/client";

export const GET_UNITS = gql`
  query GetUnits {
    units {
      _id
      name
    }
  }
`;

export const CREATE_UNIT = gql`
  mutation CreateUnit($name: String!) {
    createUnit(name: $name) {
      _id
      name
    }
  }
`;