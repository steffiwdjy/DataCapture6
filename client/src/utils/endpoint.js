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
        urlServer: "https://web.srusun.id/api",
        urlClient: "https://web.srusun.id",
    },
};

const resolveEnvironment = () => {
    const envFromVite = import.meta.env.VITE_APP_ENV;
    if (envFromVite && environments[envFromVite]) {
        return envFromVite;
    }

    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host === "web.srusun.id" || host === "webmember.srusun.id") {
            return "srusun";
        }
        if (host === "member.thejarrdin.com" || host === "apimember.thejarrdin.com") {
            return "production";
        }
        if (host === "localhost" || host === "127.0.0.1") {
            return "development";
        }
    }

    return "development";
};

const currentEnv = resolveEnvironment();

const { urlServer, urlClient } = environments[currentEnv];

export { urlServer, urlClient };
