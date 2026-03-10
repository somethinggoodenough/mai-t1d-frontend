import axios from 'axios';

// MAI-T1D backend API instance
export const flaskBackendAxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL + '/' + process.env.REACT_APP_API_GATEWAY_STAGE_NAME
});

// MAI-T1D AWS API Gateway instance
export const flaskBackendAxiosInstanceNew = axios.create({
    baseURL: 'https://nzi5e9mb0f.execute-api.us-east-1.amazonaws.com/' + process.env.REACT_APP_API_GATEWAY_STAGE_NAME
});
