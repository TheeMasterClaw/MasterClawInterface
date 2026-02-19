'use client';

import React from 'react';
import Dashboard from '../../screens/Dashboard';
import Avatar from '../../components/Avatar';
import { useUIStore } from '../../lib/store';

export default function DashboardPage() {
    const { setConnectionStatus } = useUIStore();

    return (
        <Dashboard
            mode="hybrid"
            avatar={<Avatar />}
            onConnectionStatusChange={setConnectionStatus}
        />
    );
}
