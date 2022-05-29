"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBody = void 0;
async function parseBody(req) {
    const contentType = req.headers.get('content-type');
    switch (contentType) {
        case 'application/graphql':
            return { query: await req.text() };
        case 'application/json':
            try {
                return await req.json();
            }
            catch (e) {
                if (e instanceof Error) {
                    console.error(`${e.stack || e.message}`);
                }
                throw Error(`POST body sent invalid JSON: ${e}`);
            }
        case 'application/x-www-form-urlencoded':
            return parseFormURL(req);
    }
    return {};
}
exports.parseBody = parseBody;
const parseFormURL = async (req) => {
    const text = await req.text();
    const searchParams = new URLSearchParams(text);
    const res = {};
    searchParams.forEach((v, k) => (res[k] = v));
    return res;
};
