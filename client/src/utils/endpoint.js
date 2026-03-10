const environments = {
    production: {
        urlServer: "https://apimember.thejarrdin.com",
        urlClient: "https://member.thejarrdin.com",
    },
    development: {
        urlServer: "/api",
        urlClient: "http://localhost:5173",
    },
    srusun: {
        urlServer: "https://webmember.srusun.id",
        urlClient: "https://web.srusun.id",
    },
};

const currentEnv = "development";

const { urlServer, urlClient } = environments[currentEnv];

export { urlServer, urlClient };
