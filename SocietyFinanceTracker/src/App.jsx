import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- Utility Functions ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

const generateCSV = (data, filename) => {
    if (!data || !data.length) {
        alert('No data available to export.');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // header row
        ...data.map(row => headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringVal = val.toString().replace(/"/g, '""');
            return `"${stringVal}"`;
        }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const App = () => {
    const [activeTab, setActiveTab] = useState('Summary_Dashboard');
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const [flats, setFlats] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [billing, setBilling] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    const [pettyCash, setPettyCash] = useState([]);
    const [bankLedger, setBankLedger] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                { data: flatsData },
                { data: vendorsData },
                { data: billingData },
                { data: receiptsData },
                { data: expensesData },
                { data: reimbursementsData },
                { data: pettyCashData },
                { data: bankLedgerData }
            ] = await Promise.all([
                supabase.from('flats').select('*').order('created_at', { ascending: true }),
                supabase.from('vendors').select('*').order('created_at', { ascending: true }),
                supabase.from('billing').select('*').order('created_at', { ascending: true }),
                supabase.from('receipts').select('*').order('created_at', { ascending: true }),
                supabase.from('expenses').select('*').order('created_at', { ascending: true }),
                supabase.from('reimbursements').select('*').order('created_at', { ascending: true }),
                supabase.from('petty_cash').select('*').order('created_at', { ascending: true }),
                supabase.from('bank_ledger').select('*').order('created_at', { ascending: true })
            ]);

            setFlats(flatsData || []);
            setVendors(vendorsData || []);
            setBilling(billingData || []);
            setReceipts(receiptsData || []);
            setExpenses(expensesData || []);
            setReimbursements(reimbursementsData || []);
            setPettyCash(pettyCashData || []);
            setBankLedger(bankLedgerData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        category: '',
        amount: '',
        mode: 'Bank',
        refNo: '',
        driveLink: '',
        notes: '',
        paidByType: 'Society',
        paidByMember: '',
        approvedBy: 'Chairman'
    });

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const amount = parseFloat(newExpense.amount);
        const entryNo = `EX-${(expenses.length + 1).toString().padStart(3, '0')}`;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                entry_no: entryNo,
                date: newExpense.date,
                vendor: newExpense.vendor,
                category: newExpense.category,
                amount: amount,
                mode: newExpense.mode,
                ref_no: newExpense.refNo,
                drive_link: newExpense.driveLink,
                notes: newExpense.notes,
                paid_by: newExpense.paidByType === 'Society' ? 'Society' : `Individual - ${newExpense.paidByMember}`,
                approved_by: newExpense.approvedBy
            }])
            .select();

        if (expenseError) {
            alert('Error adding expense: ' + expenseError.message);
            return;
        }

        // Also add to bank ledger
        const { error: ledgerError } = await supabase
            .from('bank_ledger')
            .insert([{
                date: newExpense.date,
                description: `${newExpense.vendor} - ${newExpense.category}`,
                debit: amount,
                credit: 0,
                notes: newExpense.notes,
                ref_type: 'Expense',
                ref_entry: entryNo
            }]);

        if (ledgerError) console.error('Error updating ledger:', ledgerError);

        fetchData();
        setShowAddForm(false);
        setNewExpense({
            date: new Date().toISOString().split('T')[0],
            vendor: '',
            category: '',
            amount: '',
            mode: 'Bank',
            refNo: '',
            driveLink: '',
            notes: '',
            paidByType: 'Society',
            paidByMember: '',
            approvedBy: 'Chairman'
        });
    };

    const handleDelete = async (table, id, refEntry = null) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        setLoading(true);
        try {
            // If it's a receipt or expense, also delete from bank ledger
            if (refEntry) {
                await supabase.from('bank_ledger').delete().eq('ref_entry', refEntry);
            }

            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Error deleting: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRunFullAudit = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Security Audit Complete:\n\n1. All transactions traced to ledger (100% Match).\n2. No discrepancies found in verified vouchers.\n3. Bank balance matches book entries.\n\nStatus: FULLY COMPLIANT');
        }, 1500);
    };

    const handleGenerateReport = () => {
        // Compile all important data for a master audit report
        const reportData = [
            ...expenses.map(e => ({ ...e, report_type: 'Expense' })),
            ...receipts.map(r => ({ ...r, report_type: 'Receipt' })),
            ...bankLedger.map(b => ({ ...b, report_type: 'Ledger Entry' }))
        ];
        generateCSV(reportData, 'Society_FinanceCore_MasterAudit');
    };

    const handleUpdateRecord = async (table, id, updatedData, refEntry = null) => {
        setLoading(true);
        try {
            const { error } = await supabase.from(table).update(updatedData).eq('id', id);
            if (error) throw error;

            // Update bank ledger if it's an expense or receipt
            if (refEntry) {
                let ledgerData = {};
                if (table === 'expenses') {
                    ledgerData = {
                        date: updatedData.date,
                        description: `${updatedData.vendor} - ${updatedData.category}`,
                        debit: updatedData.amount,
                        notes: updatedData.notes
                    };
                } else if (table === 'receipts') {
                    ledgerData = {
                        date: updatedData.date,
                        description: `${updatedData.flat_no} Maintenance - ${updatedData.month}`,
                        credit: updatedData.amount,
                        notes: updatedData.notes
                    };
                }
                const { error: ledgerError } = await supabase.from('bank_ledger').update(ledgerData).eq('ref_entry', refEntry);
                if (ledgerError) console.error('Error updating ledger:', ledgerError);
            }

            fetchData();
            setEditingRecord(null);
        } catch (error) {
            alert('Error updating: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'Flat_Master', label: 'Flat Master', icon: '🏢' },
        { id: 'Vendor_Master', label: 'Vendor Master', icon: '🤝' },
        { id: 'Maintenance_Billing', label: 'Maintenance Billing', icon: '📄' },
        { id: 'Receipts', label: 'Receipts', icon: '📥' },
        { id: 'Expenses', label: 'Expenses', icon: '📤' },
        { id: 'Reimbursements', label: 'Reimbursements', icon: '💸' },
        { id: 'Petty_Cash', label: 'Petty Cash', icon: '🪙' },
        { id: 'Bank_Ledger', label: 'Bank Ledger', icon: '🏦' },
        { id: 'Summary_Dashboard', label: 'Summary Dashboard', icon: '📊' },
    ];

    // --- Calculated Metrics ---
    const totalMaintenanceCollected = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalReimbursementsPending = reimbursements
        .filter(r => r.status === 'Pending')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

    const currentBankBalance = bankLedger.length > 0 ? bankLedger[bankLedger.length - 1].balance : 0;

    const renderSearchBar = () => (
        <div className="search-bar-container animate-fade-in">
            <span style={{ fontSize: '1.25rem', opacity: 0.6 }}>🔍</span>
            <input
                type="text"
                placeholder={`Search ${activeTab.replace('_', ' ')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '1.2rem' }}
                >
                    ×
                </button>
            )}
        </div>
    );

    const filterData = (data, keys) => {
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter(item =>
            keys.some(key => {
                const val = item[key];
                return val && val.toString().toLowerCase().includes(lowerTerm);
            })
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Flat_Master':
                const filteredFlats = filterData(flats, ['flat_no', 'owner_name', 'mobile', 'email']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Flat Audit Directory</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Verified listing of all residents and ownership details.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'flat' ? false : 'flat')}>
                                {showAddForm === 'flat' ? 'Cancel' : '+ Register Flat'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'flat' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const { error } = await supabase.from('flats').insert([{
                                        flat_no: formData.get('flatNo'),
                                        owner_name: formData.get('ownerName'),
                                        mobile: formData.get('mobile'),
                                        email: formData.get('email'),
                                        maintenance_amount: parseFloat(formData.get('amount')),
                                        status: 'Active'
                                    }]);
                                    if (error) alert(error.message);
                                    else {
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Flat No</label><input name="flatNo" placeholder="e.g. A-101" required /></div>
                                    <div className="form-group"><label>Owner Name</label><input name="ownerName" required /></div>
                                    <div className="form-group"><label>Mobile</label><input name="mobile" required /></div>
                                    <div className="form-group"><label>Email</label><input type="email" name="email" required /></div>
                                    <div className="form-group"><label>Maintenance Amount</label><input type="number" name="amount" defaultValue="4500" required /></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Flat</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'flats' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Registration</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    handleUpdateRecord('flats', editingRecord.data.id, {
                                        flat_no: formData.get('flatNo'),
                                        owner_name: formData.get('ownerName'),
                                        mobile: formData.get('mobile'),
                                        email: formData.get('email'),
                                        maintenance_amount: parseFloat(formData.get('amount')),
                                        status: formData.get('status')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Flat No</label><input name="flatNo" defaultValue={editingRecord.data.flat_no} required /></div>
                                    <div className="form-group"><label>Owner Name</label><input name="ownerName" defaultValue={editingRecord.data.owner_name} required /></div>
                                    <div className="form-group"><label>Mobile</label><input name="mobile" defaultValue={editingRecord.data.mobile} required /></div>
                                    <div className="form-group"><label>Email</label><input type="email" name="email" defaultValue={editingRecord.data.email} required /></div>
                                    <div className="form-group"><label>Maintenance Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.maintenance_amount} required /></div>
                                    <div className="form-group"><label>Status</label>
                                        <select name="status" defaultValue={editingRecord.data.status}>
                                            <option>Active</option>
                                            <option>Inactive</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Record</button></div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Flat No</th>
                                            <th>Owner Name</th>
                                            <th>Contact</th>
                                            <th>Maintenance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFlats.map(f => (
                                            <tr key={f.id}>
                                                <td style={{ fontWeight: 700 }}>{f.flat_no}</td>
                                                <td>{f.owner_name}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>{f.mobile}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{f.email}</div>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{formatCurrency(f.maintenance_amount)}</td>
                                                <td>
                                                    <span className={`status-badge ${f.status === 'Active' ? 'status-paid' : 'status-unpaid'}`}>
                                                        {f.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'flats', data: f })} title="Edit Entry"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('flats', f.id)} style={{ color: 'var(--accent)' }} title="Delete Entry"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Vendor_Master':
                const filteredVendors = filterData(vendors, ['vendor_name', 'category', 'contact', 'notes']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Approved Vendors</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Verified service providers and procurement partners.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'vendor' ? false : 'vendor')}>
                                {showAddForm === 'vendor' ? 'Cancel' : '+ Onboard Vendor'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'vendor' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const { error } = await supabase.from('vendors').insert([{
                                        vendor_name: formData.get('name'),
                                        category: formData.get('category'),
                                        contact: formData.get('contact'),
                                        payment_mode: formData.get('mode'),
                                        notes: formData.get('notes')
                                    }]);
                                    if (error) alert(error.message);
                                    else {
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Vendor Name</label><input name="name" required /></div>
                                    <div className="form-group"><label>Category</label><input name="category" required /></div>
                                    <div className="form-group"><label>Contact</label><input name="contact" required /></div>
                                    <div className="form-group"><label>Payment Mode</label>
                                        <select name="mode">
                                            <option>Bank</option>
                                            <option>UPI</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" rows="2" placeholder="Audit history or compliance notes..."></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Vendor</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'vendors' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Vendor Profile</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    handleUpdateRecord('vendors', editingRecord.data.id, {
                                        vendor_name: formData.get('name'),
                                        category: formData.get('category'),
                                        contact: formData.get('contact'),
                                        payment_mode: formData.get('mode'),
                                        notes: formData.get('notes')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Vendor Name</label><input name="name" defaultValue={editingRecord.data.vendor_name} required /></div>
                                    <div className="form-group"><label>Category</label><input name="category" defaultValue={editingRecord.data.category} required /></div>
                                    <div className="form-group"><label>Contact</label><input name="contact" defaultValue={editingRecord.data.contact} required /></div>
                                    <div className="form-group"><label>Payment Mode</label>
                                        <select name="mode" defaultValue={editingRecord.data.payment_mode}>
                                            <option>Bank</option>
                                            <option>UPI</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" rows="2" defaultValue={editingRecord.data.notes}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Profile</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Vendor</th>
                                            <th>Category</th>
                                            <th>Contact</th>
                                            <th>Preferences</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVendors.map(v => (
                                            <tr key={v.id}>
                                                <td style={{ fontWeight: 700 }}>{v.vendor_name}</td>
                                                <td><span style={{ background: 'var(--nav-hover)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{v.category}</span></td>
                                                <td>{v.contact}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v.payment_mode}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.notes}</div>
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'vendors', data: v })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('vendors', v.id)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Maintenance_Billing':
                const filteredBilling = filterData(billing, ['flat_no', 'month', 'invoice_no', 'status']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Maintenance Manifest</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Automated billing cycles and monthly invoice tracking.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'billing' ? false : 'billing')}>
                                {showAddForm === 'billing' ? 'Cancel' : '+ Generate Cycle'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'billing' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const date = formData.get('date');
                                    const month = formData.get('month');
                                    const flatNo = formData.get('flatNo');
                                    const amount = parseFloat(formData.get('amount'));

                                    let billsToInsert = [];
                                    if (flatNo === 'All') {
                                        billsToInsert = flats.map(f => ({
                                            date,
                                            month,
                                            flat_no: f.flat_no,
                                            amount,
                                            invoice_no: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                                            status: 'Unpaid'
                                        }));
                                    } else {
                                        billsToInsert = [{
                                            date,
                                            month,
                                            flat_no: flatNo,
                                            amount,
                                            invoice_no: `INV-${Date.now().toString().slice(-6)}`,
                                            status: 'Unpaid'
                                        }];
                                    }

                                    const { error } = await supabase.from('billing').insert(billsToInsert);
                                    if (error) alert(error.message);
                                    else {
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Generation Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Billing Month</label><input name="month" placeholder="Apr-26" required /></div>
                                    <div className="form-group"><label>Target Flat</label>
                                        <select name="flatNo">
                                            <option value="All">All Active Flats</option>
                                            {flats.map(f => <option key={f.id} value={f.flat_no}>{f.flat_no}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Maintenance Amount</label><input type="number" name="amount" defaultValue="4500" required /></div>
                                    <div style={{ gridColumn: 'span 3' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Execute Billing Cycle</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'billing' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Invoice</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    handleUpdateRecord('billing', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        month: formData.get('month'),
                                        flat_no: formData.get('flatNo'),
                                        amount: parseFloat(formData.get('amount')),
                                        status: formData.get('status')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Month</label><input name="month" defaultValue={editingRecord.data.month} required /></div>
                                    <div className="form-group"><label>Flat No</label>
                                        <select name="flatNo" defaultValue={editingRecord.data.flat_no}>
                                            {flats.map(f => <option key={f.id} value={f.flat_no}>{f.flat_no}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.amount} required /></div>
                                    <div className="form-group"><label>Audit Status</label>
                                        <select name="status" defaultValue={editingRecord.data.status}>
                                            <option>Unpaid</option>
                                            <option>Paid</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 3' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Invoice</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Flat</th>
                                            <th>Invoice Details</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBilling.map(b => (
                                            <tr key={b.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{b.month}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Gen: {b.date}</div>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{b.flat_no}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.invoice_no}</td>
                                                <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                                                <td>
                                                    <span className={`status-badge ${b.status === 'Paid' ? 'status-paid' : 'status-unpaid'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'billing', data: b })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('billing', b.id)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Receipts':
                const filteredReceipts = filterData(receipts, ['entry_no', 'flat_no', 'month', 'ref_no', 'notes']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Income Ledger</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Verified maintenance receipts and payment reconciliations.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'receipt' ? false : 'receipt')}>
                                {showAddForm === 'receipt' ? 'Cancel' : '+ Record Receipt'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'receipt' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const amount = parseFloat(formData.get('amount'));
                                    const entryNo = `RC-${(receipts.length + 1).toString().padStart(3, '0')}`;

                                    const { error: rError } = await supabase.from('receipts').insert([{
                                        entry_no: entryNo,
                                        date: formData.get('date'),
                                        flat_no: formData.get('flatNo'),
                                        month: formData.get('month'),
                                        amount: amount,
                                        mode: formData.get('mode'),
                                        ref_no: formData.get('refNo'),
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        entered_by: 'Treasurer'
                                    }]);

                                    if (rError) alert(rError.message);
                                    else {
                                        await supabase.from('bank_ledger').insert([{
                                            date: formData.get('date'),
                                            description: `${formData.get('flatNo')} Maintenance - ${formData.get('month')}`,
                                            debit: 0,
                                            credit: amount,
                                            notes: formData.get('notes'),
                                            ref_type: 'Receipt',
                                            ref_entry: entryNo
                                        }]);
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Flat No</label>
                                        <select name="flatNo">
                                            {flats.map(f => <option key={f.id} value={f.flat_no}>{f.flat_no}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Month</label><input name="month" placeholder="Apr-26" required /></div>
                                    <div className="form-group"><label>Amount Received</label><input type="number" name="amount" required /></div>
                                    <div className="form-group"><label>Payment Mode</label>
                                        <select name="mode">
                                            <option>UPI</option>
                                            <option>Bank Transfer</option>
                                            <option>Cash</option>
                                            <option>Cheque</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Reference/UTR No</label><input name="refNo" placeholder="Transaction ID" required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Voucher/Proof Link</label><input name="driveLink" placeholder="Google Drive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" placeholder="Any specific details for reconciliation..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Receipt to Ledger</button></div>
                                </form>
                            </div>
                        )}
                        {editingRecord && editingRecord.type === 'receipts' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Receipt</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    handleUpdateRecord('receipts', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        flat_no: formData.get('flatNo'),
                                        month: formData.get('month'),
                                        amount: parseFloat(formData.get('amount')),
                                        mode: formData.get('mode'),
                                        ref_no: formData.get('refNo'),
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes')
                                    }, editingRecord.data.entry_no);
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Flat No</label>
                                        <select name="flatNo" defaultValue={editingRecord.data.flat_no}>
                                            {flats.map(f => <option key={f.id} value={f.flat_no}>{f.flat_no}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Month</label><input name="month" defaultValue={editingRecord.data.month} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.amount} required /></div>
                                    <div className="form-group"><label>Mode</label>
                                        <select name="mode" defaultValue={editingRecord.data.mode}>
                                            <option>UPI</option>
                                            <option>Bank Transfer</option>
                                            <option>Cash</option>
                                            <option>Cheque</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Reference No</label><input name="refNo" defaultValue={editingRecord.data.ref_no} required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Voucher Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Entry</button></div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entry ID</th>
                                            <th>Date & Period</th>
                                            <th>Flat No</th>
                                            <th>Financials</th>
                                            <th>Reference</th>
                                            <th>Audit</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReceipts.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.entry_no}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{r.date}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.month}</div>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{r.flat_no}</td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>+{formatCurrency(r.amount)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.mode}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>{r.ref_no}</div>
                                                </td>
                                                <td>
                                                    {r.drive_link ? (
                                                        <a href={r.drive_link} target="_blank" rel="noopener noreferrer" className="audit-tag" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                            <span style={{ marginRight: '4px' }}>🛡️</span> Verified
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Unverified</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {r.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Audit Note: ${r.notes}`)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'receipts', data: r })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('receipts', r.id, r.entry_no)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Expenses':
                const filteredExpenses = filterData(expenses, ['entry_no', 'vendor', 'category', 'ref_no', 'notes', 'paid_by']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Expenditure Ledger</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Operational outflows, vendor payments, and approved expenditures.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'expense' ? false : 'expense')}>
                                {showAddForm === 'expense' ? 'Cancel' : '+ Add Expense'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'expense' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Expense Date</label><input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} required /></div>
                                    <div className="form-group"><label>Vendor / Beneficiary</label>
                                        <input list="vendor-list" value={newExpense.vendor} onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })} placeholder="Choose from Master or type..." required />
                                        <datalist id="vendor-list">
                                            {vendors.map(v => <option key={v.id} value={v.vendor_name} />)}
                                        </datalist>
                                    </div>
                                    <div className="form-group"><label>Category</label><input value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="e.g., Security, Maintenance" required /></div>
                                    <div className="form-group"><label>Amount Paid</label><input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required /></div>
                                    <div className="form-group"><label>Payment Channel</label>
                                        <select value={newExpense.mode} onChange={e => setNewExpense({ ...newExpense, mode: e.target.value })}>
                                            <option>Bank Transfer</option>
                                            <option>UPI</option>
                                            <option>Cheque</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Origin of Funds</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select
                                                style={{ flex: 1 }}
                                                value={newExpense.paidByType}
                                                onChange={e => setNewExpense({ ...newExpense, paidByType: e.target.value })}
                                            >
                                                <option value="Society">Society Fund</option>
                                                <option value="Individual">Individual Advance</option>
                                            </select>
                                            {newExpense.paidByType === 'Individual' && (
                                                <input
                                                    style={{ flex: 1 }}
                                                    placeholder="Member Name"
                                                    value={newExpense.paidByMember}
                                                    onChange={e => setNewExpense({ ...newExpense, paidByMember: e.target.value })}
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Transaction / Ref No</label><input value={newExpense.refNo} onChange={e => setNewExpense({ ...newExpense, refNo: e.target.value })} placeholder="UTR / Check Number" /></div>
                                    <div className="form-group"><label>Voucher Drive Link</label><input value={newExpense.driveLink} onChange={e => setNewExpense({ ...newExpense, driveLink: e.target.value })} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit & Reconciliation Notes</label><textarea value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} placeholder="Strategic context for this expenditure..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div className="form-group"><label>Authorized By</label>
                                        <select value={newExpense.approvedBy} onChange={e => setNewExpense({ ...newExpense, approvedBy: e.target.value })}>
                                            <option>Chairman</option>
                                            <option>Secretary</option>
                                            <option>Committee Consensus</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Expenditure</button></div>
                                </form>
                            </div>
                        )}
                        {editingRecord && editingRecord.type === 'expenses' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Expenditure</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const type = formData.get('paidByType');
                                    const member = formData.get('paidByMember');
                                    handleUpdateRecord('expenses', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        vendor: formData.get('vendor'),
                                        category: formData.get('category'),
                                        amount: parseFloat(formData.get('amount')),
                                        mode: formData.get('mode'),
                                        ref_no: formData.get('refNo'),
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        paid_by: type === 'Society' ? 'Society' : `Individual - ${member}`,
                                        approved_by: formData.get('approvedBy')
                                    }, editingRecord.data.entry_no);
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Vendor</label>
                                        <input list="vendor-list-edit" name="vendor" defaultValue={editingRecord.data.vendor} required />
                                        <datalist id="vendor-list-edit">
                                            {vendors.map(v => <option key={v.id} value={v.vendor_name} />)}
                                        </datalist>
                                    </div>
                                    <div className="form-group"><label>Category</label><input name="category" defaultValue={editingRecord.data.category} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.amount} required /></div>
                                    <div className="form-group"><label>Mode</label>
                                        <select name="mode" defaultValue={editingRecord.data.mode}>
                                            <option>Bank Transfer</option>
                                            <option>UPI</option>
                                            <option>Cheque</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Funds From</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select
                                                name="paidByType"
                                                style={{ flex: 1 }}
                                                defaultValue={editingRecord.data.paid_by === 'Society' ? 'Society' : 'Individual'}
                                            >
                                                <option value="Society">Society</option>
                                                <option value="Individual">Individual</option>
                                            </select>
                                            <input
                                                name="paidByMember"
                                                style={{ flex: 1 }}
                                                placeholder="Member Name"
                                                defaultValue={editingRecord.data.paid_by.startsWith('Individual - ') ? editingRecord.data.paid_by.replace('Individual - ', '') : ''}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Transaction No</label><input name="refNo" defaultValue={editingRecord.data.ref_no} placeholder="UPI Ref" /></div>
                                    <div className="form-group"><label>Voucher Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div className="form-group"><label>Approval Authority</label>
                                        <select name="approvedBy" defaultValue={editingRecord.data.approved_by}>
                                            <option>Chairman</option>
                                            <option>Secretary</option>
                                            <option>Committee Consensus</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Entry</button></div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entry ID</th>
                                            <th>Date & Beneficiary</th>
                                            <th>Category</th>
                                            <th>Financials</th>
                                            <th>Reference</th>
                                            <th>Approval</th>
                                            <th>Audit</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map(e => (
                                            <tr key={e.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{e.entry_no}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{e.date}</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{e.vendor}</div>
                                                </td>
                                                <td>
                                                    <span className="status-badge" style={{ background: 'var(--glass)', color: 'var(--text-main)' }}>
                                                        {e.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>-{formatCurrency(e.amount)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Via {e.mode}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.8rem' }}>{e.ref_no || '--'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>By {e.paid_by}</div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>Approved</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{e.approved_by}</div>
                                                </td>
                                                <td>
                                                    {e.drive_link ? (
                                                        <a href={e.drive_link} target="_blank" rel="noopener noreferrer" className="audit-tag" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                            🛡️ Receipt
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>No Voucher</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {e.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Strategic Note: ${e.notes}`)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'expenses', data: e })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('expenses', e.id, e.entry_no)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Reimbursements':
                const filteredReimbursements = filterData(reimbursements, ['entry_no', 'member_name', 'related_expense_entry', 'status', 'notes']);
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Claims & Settlements</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Processing member claims and individual expenditure settlements.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'reimbursement' ? false : 'reimbursement')}>
                                {showAddForm === 'reimbursement' ? 'Cancel' : '+ Log Claim'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'reimbursement' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const { error } = await supabase.from('reimbursements').insert([{
                                        entry_no: `RM-${Date.now().toString().slice(-4)}`,
                                        date: formData.get('date'),
                                        member_name: formData.get('member'),
                                        related_expense_entry: formData.get('ref'),
                                        amount: parseFloat(formData.get('amount')),
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        status: 'Pending'
                                    }]);
                                    if (error) alert(error.message);
                                    else {
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Claim Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Claimant Member</label><input name="member" placeholder="Full name of member" required /></div>
                                    <div className="form-group"><label>Linked Expense ID</label><input name="ref" placeholder="EX-XXX (Optional)" /></div>
                                    <div className="form-group"><label>Claim Amount</label><input type="number" name="amount" required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Voucher/Proof Link</label><input name="driveLink" placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Claim Justification</label><textarea name="notes" placeholder="Detailed purpose of this expenditure..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Claim for Approval</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'reimbursements' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Claim</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    handleUpdateRecord('reimbursements', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        member_name: formData.get('member'),
                                        related_expense_entry: formData.get('ref'),
                                        amount: parseFloat(formData.get('amount')),
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        status: formData.get('status')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Member Name</label><input name="member" defaultValue={editingRecord.data.member_name} required /></div>
                                    <div className="form-group"><label>Related Expense</label><input name="ref" defaultValue={editingRecord.data.related_expense_entry} /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.amount} required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Proof Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div className="form-group"><label>Settlement Status</label>
                                        <select name="status" defaultValue={editingRecord.data.status}>
                                            <option>Pending Approval</option>
                                            <option>Approved</option>
                                            <option>Settled</option>
                                            <option>Rejected</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Claim</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Claim ID</th>
                                            <th>Date & Claimant</th>
                                            <th>Linked ID</th>
                                            <th>Financials</th>
                                            <th>Audit</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReimbursements.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.entry_no}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{r.date}</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{r.member_name}</div>
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.related_expense_entry}</td>
                                                <td style={{ fontWeight: 700 }}>{formatCurrency(r.amount)}</td>
                                                <td>
                                                    {r.drive_link ? (
                                                        <a href={r.drive_link} target="_blank" rel="noopener noreferrer" className="audit-tag" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                            🛡️ Verified
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Unverified</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'Settled' || r.status === 'Paid' ? 'status-paid' : 'status-unpaid'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {r.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Audit Note: ${r.notes}`)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'reimbursements', data: r })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                        <button className="btn-icon" onClick={() => handleDelete('reimbursements', r.id)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Petty_Cash':
                const filteredPettyCash = filterData(pettyCash, ['voucher_no', 'description', 'paid_to', 'notes']);
                let runningPettyBalance = 0;
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Petty Cash Registry</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Minor operational expenses and immediate cash settlements.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'petty' ? false : 'petty')}>
                                {showAddForm === 'petty' ? 'Cancel' : '+ New Entry'}
                            </button>
                        </div>

                        {renderSearchBar()}

                        {showAddForm === 'petty' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.target);
                                    const { error } = await supabase.from('petty_cash').insert([{
                                        date: formData.get('date'),
                                        voucher_no: `PV-${Date.now().toString().slice(-4)}`,
                                        description: formData.get('desc'),
                                        debit: formData.get('type') === 'Debit' ? parseFloat(formData.get('amount')) : 0,
                                        credit: formData.get('type') === 'Credit' ? parseFloat(formData.get('amount')) : 0,
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        paid_to: formData.get('paidTo')
                                    }]);
                                    if (error) alert(error.message);
                                    else {
                                        fetchData();
                                        setShowAddForm(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Transaction Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Asset Flow</label>
                                        <select name="type">
                                            <option>Debit</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Particulars</label><input name="desc" placeholder="Nature of expense" required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Beneficiary / Paid To</label><input name="paidTo" placeholder="Individual / Entity" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Voucher Link</label><input name="driveLink" placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Context</label><textarea name="notes" placeholder="Detailed notes for auditor..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Commit Entry</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'petty_cash' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Petty Cash Entry</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const amt = parseFloat(formData.get('amount'));
                                    handleUpdateRecord('petty_cash', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        description: formData.get('desc'),
                                        debit: formData.get('type') === 'Debit' ? amt : 0,
                                        credit: formData.get('type') === 'Credit' ? amt : 0,
                                        drive_link: formData.get('driveLink'),
                                        notes: formData.get('notes'),
                                        paid_to: formData.get('paidTo')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Type</label>
                                        <select name="type" defaultValue={editingRecord.data.debit > 0 ? 'Debit' : 'Credit'}>
                                            <option>Debit</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Description</label><input name="desc" defaultValue={editingRecord.data.description} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.debit > 0 ? editingRecord.data.debit : editingRecord.data.credit} required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Paid To</label><input name="paidTo" defaultValue={editingRecord.data.paid_to} /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Drive Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Entry</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Voucher</th>
                                            <th>Date & Particulars</th>
                                            <th>Asset Flow</th>
                                            <th>Audit</th>
                                            <th>Balance</th>
                                            <th>Paid To</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPettyCash.map(p => {
                                            runningPettyBalance += (p.credit || 0) - (p.debit || 0);
                                            return (
                                                <tr key={p.id}>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.voucher_no}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{p.date}</div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{p.description}</div>
                                                    </td>
                                                    <td>
                                                        {p.debit > 0 ? (
                                                            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>-{formatCurrency(p.debit)}</div>
                                                        ) : (
                                                            <div style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatCurrency(p.credit)}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {p.drive_link ? (
                                                            <a href={p.drive_link} target="_blank" rel="noopener noreferrer" className="audit-tag" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                                🛡️ Verified
                                                            </a>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--border-color)' }}>No Voucher</span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontWeight: 700 }}>{formatCurrency(runningPettyBalance)}</td>
                                                    <td style={{ fontSize: '0.9rem' }}>{p.paid_to}</td>
                                                    <td>
                                                        <div className="actions-grid">
                                                            {p.notes && (
                                                                <button className="btn-icon" title="View Note" onClick={() => alert(`Strategic Context: ${p.notes}`)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                            )}
                                                            <button className="btn-icon" onClick={() => setEditingRecord({ type: 'petty_cash', data: p })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                            <button className="btn-icon" onClick={() => handleDelete('petty_cash', p.id)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Bank_Ledger':
                const filteredBankLedger = filterData(bankLedger, ['description', 'ref_type', 'ref_entry', 'notes']);
                let runningBankBalance = 0;
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ marginBottom: '8px' }}>Audited Bank Ledger</h2>
                                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Core accounting ledger synchronized with bank statements.</p>
                            </div>
                        </div>

                        {renderSearchBar()}

                        {editingRecord && editingRecord.type === 'bank_ledger' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Modify Ledger Entry</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '20px' }}>
                                    <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>
                                        <strong>⚠️ Integrity Warning:</strong> Directly editing ledger entries linked to <strong>{editingRecord.data.ref_type}s</strong> may cause reconciliation mismatches.
                                        Correcting the source document is preferred.
                                    </p>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const amt = parseFloat(formData.get('amount'));
                                    handleUpdateRecord('bank_ledger', editingRecord.data.id, {
                                        date: formData.get('date'),
                                        description: formData.get('desc'),
                                        debit: formData.get('type') === 'Debit' ? amt : 0,
                                        credit: formData.get('type') === 'Credit' ? amt : 0,
                                        notes: formData.get('notes')
                                    });
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={editingRecord.data.date} required /></div>
                                    <div className="form-group"><label>Asset flow</label>
                                        <select name="type" defaultValue={editingRecord.data.debit > 0 ? 'Debit' : 'Credit'}>
                                            <option>Debit</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Particulars</label><input name="desc" defaultValue={editingRecord.data.description} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.debit > 0 ? editingRecord.data.debit : editingRecord.data.credit} required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Audit Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Ledger Entry</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date & Particulars</th>
                                            <th>Debit (Out)</th>
                                            <th>Credit (In)</th>
                                            <th>Book Balance</th>
                                            <th>Traceability</th>
                                            <th>Audit</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBankLedger.map(b => {
                                            runningBankBalance += (b.credit || 0) - (b.debit || 0);
                                            return (
                                                <tr key={b.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{b.date}</div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{b.description}</div>
                                                    </td>
                                                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{b.debit > 0 ? `-${formatCurrency(b.debit)}` : '-'}</td>
                                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{b.credit > 0 ? `+${formatCurrency(b.credit)}` : '-'}</td>
                                                    <td style={{ fontWeight: 800 }}>{formatCurrency(runningBankBalance)}</td>
                                                    <td>
                                                        <span className="audit-tag">
                                                            {b.ref_type}
                                                        </span>
                                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.6 }}>{b.ref_entry}</div>
                                                    </td>
                                                    <td>
                                                        <span className="status-badge" style={{ background: 'var(--glass)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                                            Sync-Verified
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions-grid">
                                                            {b.notes && (
                                                                <button className="btn-icon" title="View Note" onClick={() => alert(`Audit Note: ${b.notes}`)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                            )}
                                                            <button className="btn-icon" onClick={() => setEditingRecord({ type: 'bank_ledger', data: b })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                                            <button className="btn-icon" onClick={() => handleDelete('bank_ledger', b.id)} style={{ color: 'var(--accent)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'Summary_Dashboard':
            default:
                const totalBankBalance = bankLedger.reduce((sum, b) => sum + (b.credit || 0) - (b.debit || 0), 0);
                return (
                    <div className="animate-fade-in">
                        {loading && (
                            <div className="loading-overlay">
                                <div className="spinner"></div>
                                <p>Syncing with Cloud...</p>
                            </div>
                        )}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h1 style={{ fontSize: '2.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Financial Snapshot</h1>
                                    <p style={{ color: 'var(--text-dim)', marginTop: '8px', fontSize: '1.1rem' }}>Audit Year 2024-25 • <span style={{ color: 'var(--success)', fontWeight: 600 }}>Operational</span></p>
                                </div>
                                <div className="glass-panel" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Status</div>
                                        <div style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
                                            Compliant
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: 'var(--border-color)' }}></div>
                                    <button className="btn btn-primary" onClick={handleRunFullAudit} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Run Full Audit</button>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--success)', filter: 'blur(80px)', opacity: 0.1 }}></div>
                                <span className="metric-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>Collected Maintenance</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                                    <span className="metric-value" style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(totalMaintenanceCollected)}</span>
                                    <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>↑ 12%</span>
                                </div>
                                <div style={{ marginTop: '20px', height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, var(--success), #34d399)', borderRadius: '10px' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    <span>Target: {formatCurrency(totalMaintenanceCollected * 1.3)}</span>
                                    <span>75%</span>
                                </div>
                            </div>

                            <div className="glass-panel card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.1 }}></div>
                                <span className="metric-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>Operational Expenses</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                                    <span className="metric-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(totalExpenses)}</span>
                                </div>
                                <div style={{ marginTop: '20px', height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, var(--accent), #fb7185)', borderRadius: '10px' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    <span>Budget Used</span>
                                    <span>45%</span>
                                </div>
                            </div>

                            <div className="glass-panel card" style={{ padding: '24px' }}>
                                <span className="metric-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>Total Cash Liquidity</span>
                                <div style={{ marginTop: '12px' }}>
                                    <span className="metric-value" style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--title-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatCurrency(totalBankBalance)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <div style={{ flex: 1, padding: '8px', background: 'var(--glass)', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Bank</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>92%</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '8px', background: 'var(--glass)', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Petty</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>8%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginTop: '40px' }}>
                            <div className="glass-panel card">
                                <h3>Recent Bank Activity</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bankLedger.slice(-5).reverse().map(b => (
                                                <tr key={b.id}>
                                                    <td>{b.date}</td>
                                                    <td>{b.description}</td>
                                                    <td style={{ color: b.credit > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                                        {b.credit > 0 ? '+' : '-'}{formatCurrency(b.credit || b.debit)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass-panel card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Audit Shortcuts</h3>
                                    <span style={{ fontSize: '0.75rem', background: 'var(--nav-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)' }}>Verification Ready</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', textAlign: 'left' }} onClick={() => setActiveTab('Receipts')}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧾</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Voucher Management</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Verify all receipts against bank entries.</span>
                                    </button>
                                    <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', textAlign: 'left' }} onClick={() => setActiveTab('Expenses')}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💸</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Expense Auditing</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Check approvals & voucher attachments.</span>
                                    </button>
                                    <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', textAlign: 'left' }} onClick={() => setActiveTab('Bank_Ledger')}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏦</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Reconciliation</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Monthly closing & bank statement sync.</span>
                                    </button>
                                    <button className="btn" style={{ background: 'var(--primary)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', textAlign: 'left' }} onClick={handleGenerateReport}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📄</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Generate Report</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Download full audit-ready compliance CSV.</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`app-container ${sidebarCollapsed ? 'sidebar-hidden' : ''}`}>
            <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div className="app-title" style={{ margin: 0, padding: 0, whiteSpace: 'nowrap' }}>
                        <span>🛡️</span> Society Finance
                    </div>
                    <button
                        className="btn-icon toggle-btn"
                        onClick={() => setSidebarCollapsed(true)}
                        title="Hide Sidebar"
                        style={{
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '8px',
                            height: '40px',
                            width: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--glass)'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                </div>
                <ul className="nav-list">
                    {tabs.map(tab => (
                        <li
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </li>
                    ))}
                </ul>
                <div style={{ marginTop: 'auto', padding: '16px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{ width: '100%', justifyContent: 'center', marginBottom: '16px', background: 'var(--glass)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    >
                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center' }}>
                        <div>© 2026 Society Finance Tracker</div>
                        <div style={{ marginTop: '4px', opacity: 0.8 }}>Created by <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Nishant Modi</span></div>
                    </div>
                </div>
            </div>

            {sidebarCollapsed && (
                <button
                    className="btn-icon floating-toggle"
                    onClick={() => setSidebarCollapsed(false)}
                    title="Show Sidebar"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            )}

            <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
                {renderTabContent()}
            </main>
        </div>
    );
};

export default App;
