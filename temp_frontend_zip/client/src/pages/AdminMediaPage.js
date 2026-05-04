import React from 'react';
import BackLink from '../components/BackLink';
import MediaGrid from '../components/MediaGrid';
import Card, { CardBody, CardHeader } from '../components/ui/Card';

const AdminMediaPage = () => {
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <BackLink to="/admin" label="Back to Admin" />

                <Card className="mb-5">
                    <CardHeader>
                        <h1 className="text-2xl font-semibold text-slate-900">Manage Media</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Create, edit, and remove media posts shown in the public feed.
                        </p>
                    </CardHeader>
                    <CardBody>
                <MediaGrid title="" limit={100} clickable={true} adminMode={true} />
                    </CardBody>
                </Card>
            </div>
    );
};

export default AdminMediaPage;
