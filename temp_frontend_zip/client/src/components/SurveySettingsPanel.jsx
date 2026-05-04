import React from 'react';
import Card, { CardBody } from './ui/Card';
import Input from './ui/Input';

export const SurveySettingsPanel = ({ settings, onChange }) => {
    const handleChange = (field, value) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    return (
        <Card>
            <CardBody className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">Survey Settings</h3>
                    <p className="mt-1 text-sm text-slate-500">Define response behavior and availability.</p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-3">
                        <label className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                                checked={settings.allow_multiple_submissions || false}
                                onChange={(e) => handleChange('allow_multiple_submissions', e.target.checked)}
                            />
                            <span>Allow multiple submissions per user</span>
                        </label>
                        <p className="mt-2 text-xs text-slate-500">If disabled, each user can submit only once.</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                        <label className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                                checked={settings.is_anonymous || false}
                                onChange={(e) => handleChange('is_anonymous', e.target.checked)}
                            />
                            <span>Anonymous responses</span>
                        </label>
                        <p className="mt-2 text-xs text-slate-500">Hide identity data from response records.</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                        <label className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                                checked={settings.collect_email || false}
                                onChange={(e) => handleChange('collect_email', e.target.checked)}
                            />
                            <span>Require email for submission</span>
                        </label>
                        <p className="mt-2 text-xs text-slate-500">Collect respondent email with submissions.</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="expiry-date" className="text-sm font-medium text-slate-700">Survey expiry date (optional)</label>
                        <Input
                            id="expiry-date"
                            type="datetime-local"
                            value={settings.expiry_date ? settings.expiry_date.slice(0, 16) : ''}
                            onChange={(e) => {
                                const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                                handleChange('expiry_date', value);
                            }}
                        />
                        <p className="text-xs text-slate-500">After this date, the survey will no longer accept responses.</p>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default SurveySettingsPanel;
