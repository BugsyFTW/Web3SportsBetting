import axios from "axios";

export const api = axios.create({
  headers: {
    'X-Auth-Token': ''
  }
});