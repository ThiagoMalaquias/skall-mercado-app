import { Environment } from "./types";

type Host = { HOST: string };
type GetHostByEnvironment = (env: Environment) => Host;
type Hosts = { [k in Environment]: Host };
const getHostByEnvironment: GetHostByEnvironment = (env) => {
  const defaultHost: Host = {
    HOST: "https://app-pdv-4d4c073422f8.herokuapp.com/",
  };
  const hosts: Hosts = {
    development: {
      ...defaultHost,
    },
    staging: {
      ...defaultHost,
    },
    production: {
      ...defaultHost,
    },
    test: {
      ...defaultHost,
    },
  };
  return hosts[env];
};

export const { HOST } = getHostByEnvironment(
  (process.env.SERVER_ENV ?? "test") as Environment
);
