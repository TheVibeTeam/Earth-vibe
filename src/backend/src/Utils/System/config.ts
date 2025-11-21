interface Status {
    reqGet: (req: any, params?: string[]) => any
    reqPost: (req: any, params?: string[]) => any
    url: (url: string) => any
    number: (str: string) => any
    invalidURL: any
    error: (msg?: string) => any
}

export default new class Config {
    public sockets: any[] = [];
    public routes: any[] = [];
    public graphql: {
        queries: any[],
        mutations: any[],
        subscriptions: any[],
        types: any[]
    } = {
        queries: [],
        mutations: [],
        subscriptions: [],
        types: []
    };
    public status: Status = {
        reqGet: (req: any, params?: string[]) => {
            if (!params) return { status: true }
            const required = params.filter(key => !(key in req.query) || !req.query[key])
            if (required.length > 0) return {
                creator: process.env.WEBSERVER_AUTHOR,
                status: false,
                msg: `parameter ${required.length > 1 ? '"' + required.slice(0, -1).join('", "') + '" and "' + required.slice(-1) + '"' : '"' + required[0] + '"'} is required`
            }
            return { status: true }
        },
        reqPost: (req: any, params?: string[]) => {
            if (!params) return { status: true }
            const required = params.filter(key => !(key in req.body) || !req.body[key])
            if (required.length > 0) return {
                creator: process.env.WEBSERVER_AUTHOR,
                status: false,
                msg: `parameter ${required.length > 1 ? required.slice(0, -1).join(', ') + ' and ' + required[required.length - 1] : required[0]} is required`
            }
            return { status: true }
        },
        url: (url: string) => {
            try {
                new URL(url)
                return { status: true }
            } catch {
                return {
                    creator: process.env.WEBSERVER_AUTHOR,
                    status: false,
                    msg: 'argument must be of type url!'
                }
            }
        },
        number: (str: string) => {
            if (isNaN(Number(str))) return {
                creator: process.env.WEBSERVER_AUTHOR,
                status: false,
                msg: 'argument must be of type number!'
            }
            return { status: true }
        },
        invalidURL: {
            creator: process.env.WEBSERVER_AUTHOR,
            status: false,
            msg: 'invalid URL!'
        },
        error: (msg?: string) => {
            return {
                creator: process.env.WEBSERVER_AUTHOR,
                status: false,
                msg: msg || 'Something went wrong'
            }
        }
    }
}