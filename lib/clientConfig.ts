export type ClientId = 'vrm' | 'ryze';

export interface ClientConfig {
    clientId: ClientId;
    leads: {
        hasPhone: boolean;
        hasPostalCode: boolean;
        hasCustomerType: boolean;
        hasPosition: boolean;
    };
    charts: {
        showContactChannelChart: boolean;
        showCustomerTypeChart: boolean;
        showCustomerRegionChart: boolean;
        showVermarktungsregionen: boolean;
        showSankeyChart: boolean;
    };
}

const configs: Record<ClientId, ClientConfig> = {
    vrm: {
        clientId: 'vrm',
        leads: {
            hasPhone: true,
            hasPostalCode: true,
            hasCustomerType: true,
            hasPosition: false,
        },
        charts: {
            showContactChannelChart: true,
            showCustomerTypeChart: true,
            showCustomerRegionChart: true,
            showVermarktungsregionen: true,
            showSankeyChart: true,
        },
    },
    ryze: {
        clientId: 'ryze',
        leads: {
            hasPhone: false,
            hasPostalCode: false,
            hasCustomerType: false,
            hasPosition: true,
        },
        charts: {
            showContactChannelChart: false,
            showCustomerTypeChart: false,
            showCustomerRegionChart: false,
            showVermarktungsregionen: false,
            showSankeyChart: true,
        },
    },
};

export function getClientConfig(): ClientConfig {
    const clientId = (process.env.CLIENT_ID ?? 'vrm') as ClientId;
    const config = configs[clientId];
    if (!config) throw new Error(`Unknown CLIENT_ID: "${clientId}"`);
    return config;
}