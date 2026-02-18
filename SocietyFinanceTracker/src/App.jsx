import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- Utility Functions ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

const App = () => {
    const [activeTab, setActiveTab] = useState('Summary_Dashboard');
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Flat_Master':
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Flat Master</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'flat' ? false : 'flat')}>
                                {showAddForm === 'flat' ? 'Cancel' : '+ Add Flat'}
                            </button>
                        </div>

                        {showAddForm === 'flat' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Flat</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'flats' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Flat Details</h3>
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
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Flat</button></div>
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
                                            <th>Mobile</th>
                                            <th>Email</th>
                                            <th>Maintenance Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flats.map(f => (
                                            <tr key={f.id}>
                                                <td>{f.flat_no}</td>
                                                <td>{f.owner_name}</td>
                                                <td>{f.mobile}</td>
                                                <td>{f.email}</td>
                                                <td>{formatCurrency(f.maintenance_amount)}</td>
                                                <td>{f.status}</td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'flats', data: f })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('flats', f.id)}>🗑️</button>
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
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Vendor Master</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'vendor' ? false : 'vendor')}>
                                {showAddForm === 'vendor' ? 'Cancel' : '+ Add Vendor'}
                            </button>
                        </div>

                        {showAddForm === 'vendor' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" rows="2"></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Vendor</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'vendors' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Vendor Details</h3>
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
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" rows="2" defaultValue={editingRecord.data.notes}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Vendor</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Vendor Name</th>
                                            <th>Category</th>
                                            <th>Contact</th>
                                            <th>Payment Mode</th>
                                            <th>Notes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendors.map(v => (
                                            <tr key={v.id}>
                                                <td>{v.vendor_name}</td>
                                                <td>{v.category}</td>
                                                <td>{v.contact}</td>
                                                <td>{v.payment_mode}</td>
                                                <td>{v.notes}</td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'vendors', data: v })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('vendors', v.id)}>🗑️</button>
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
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Maintenance Billing</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'billing' ? false : 'billing')}>
                                {showAddForm === 'billing' ? 'Cancel' : '+ Generate Bill'}
                            </button>
                        </div>

                        {showAddForm === 'billing' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div className="form-group"><label>Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Month</label><input name="month" placeholder="Apr-26" required /></div>
                                    <div className="form-group"><label>Flat No</label>
                                        <select name="flatNo">
                                            <option value="All">All Flats</option>
                                            {flats.map(f => <option key={f.id} value={f.flat_no}>{f.flat_no}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue="4500" required /></div>
                                    <div style={{ gridColumn: 'span 3' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Generate Billing</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'billing' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Billing Record</h3>
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
                                    <div className="form-group"><label>Status</label>
                                        <select name="status" defaultValue={editingRecord.data.status}>
                                            <option>Unpaid</option>
                                            <option>Paid</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 3' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Billing</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Month</th>
                                            <th>Flat No</th>
                                            <th>Amount</th>
                                            <th>Invoice No</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.date}</td>
                                                <td>{b.month}</td>
                                                <td>{b.flat_no}</td>
                                                <td>{formatCurrency(b.amount)}</td>
                                                <td>{b.invoice_no}</td>
                                                <td><span className={b.status === 'Paid' ? 'status-paid' : 'status-unpaid'}>{b.status}</span></td>
                                                <td>
                                                    <div className="actions-grid">
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'billing', data: b })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('billing', b.id)}>🗑️</button>
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
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Receipts (Money In)</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'receipt' ? false : 'receipt')}>
                                {showAddForm === 'receipt' ? 'Cancel' : '+ Record Receipt'}
                            </button>
                        </div>

                        {showAddForm === 'receipt' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" required /></div>
                                    <div className="form-group"><label>Mode</label>
                                        <select name="mode">
                                            <option>UPI</option>
                                            <option>Bank</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Reference No</label><input name="refNo" required /></div>
                                    <div className="form-group"><label>Drive Link</label><input name="driveLink" placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" placeholder="Additional details..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Record Receipt</button></div>
                                </form>
                            </div>
                        )}
                        {editingRecord && editingRecord.type === 'receipts' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Receipt Record</h3>
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
                                            <option>Bank</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Reference No</label><input name="refNo" defaultValue={editingRecord.data.ref_no} required /></div>
                                    <div className="form-group"><label>Drive Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Receipt</button></div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entry No</th>
                                            <th>Date</th>
                                            <th>Flat No</th>
                                            <th>Month</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Ref No</th>
                                            <th>Links</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receipts.map(r => (
                                            <tr key={r.id}>
                                                <td>{r.entry_no}</td>
                                                <td>{r.date}</td>
                                                <td>{r.flat_no}</td>
                                                <td>{r.month}</td>
                                                <td>{formatCurrency(r.amount)}</td>
                                                <td>{r.mode}</td>
                                                <td>{r.ref_no}</td>
                                                <td>{r.drive_link && <a href={r.drive_link} target="_blank" rel="noopener noreferrer">📂 Drive</a>}</td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {r.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Note: ${r.notes}`)}>📝</button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'receipts', data: r })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('receipts', r.id, r.entry_no)}>🗑️</button>
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
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Expenses (Money Out)</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'expense' ? false : 'expense')}>
                                {showAddForm === 'expense' ? 'Cancel' : '+ Add Expense'}
                            </button>
                        </div>

                        {showAddForm === 'expense' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
                                <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group"><label>Date</label><input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} required /></div>
                                    <div className="form-group"><label>Vendor</label>
                                        <input list="vendor-list" value={newExpense.vendor} onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })} required />
                                        <datalist id="vendor-list">
                                            {vendors.map(v => <option key={v.id} value={v.vendor_name} />)}
                                        </datalist>
                                    </div>
                                    <div className="form-group"><label>Category</label><input value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required /></div>
                                    <div className="form-group"><label>Mode</label>
                                        <select value={newExpense.mode} onChange={e => setNewExpense({ ...newExpense, mode: e.target.value })}>
                                            <option>Bank</option>
                                            <option>UPI</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Paid By</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select
                                                style={{ flex: 1 }}
                                                value={newExpense.paidByType}
                                                onChange={e => setNewExpense({ ...newExpense, paidByType: e.target.value })}
                                            >
                                                <option value="Society">Society</option>
                                                <option value="Individual">Individual</option>
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
                                    <div className="form-group"><label>Transaction / Ref No</label><input value={newExpense.refNo} onChange={e => setNewExpense({ ...newExpense, refNo: e.target.value })} placeholder="UPI Ref / Check No" /></div>
                                    <div className="form-group"><label>Drive Link</label><input value={newExpense.driveLink} onChange={e => setNewExpense({ ...newExpense, driveLink: e.target.value })} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} placeholder="Additional details..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div className="form-group"><label>Approved By</label>
                                        <select value={newExpense.approvedBy} onChange={e => setNewExpense({ ...newExpense, approvedBy: e.target.value })}>
                                            <option>Chairman</option>
                                            <option>Secretary</option>
                                            <option>Commitee</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Expense</button></div>
                                </form>
                            </div>
                        )}
                        {editingRecord && editingRecord.type === 'expenses' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Expense Details</h3>
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
                                            <option>Bank</option>
                                            <option>UPI</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Paid By</label>
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
                                    <div className="form-group"><label>Drive Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div className="form-group"><label>Approved By</label>
                                        <select name="approvedBy" defaultValue={editingRecord.data.approved_by}>
                                            <option>Chairman</option>
                                            <option>Secretary</option>
                                            <option>Commitee</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Expense</button></div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entry No</th>
                                            <th>Date</th>
                                            <th>Vendor</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Trans No</th>
                                            <th>Paid By</th>
                                            <th>Links</th>
                                            <th>Approved By</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(e => (
                                            <tr key={e.id}>
                                                <td>{e.entry_no}</td>
                                                <td>{e.date}</td>
                                                <td>{e.vendor}</td>
                                                <td>{e.category}</td>
                                                <td>{formatCurrency(e.amount)}</td>
                                                <td>{e.mode}</td>
                                                <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{e.ref_no}</td>
                                                <td>{e.paid_by}</td>
                                                <td>{e.drive_link && <a href={e.drive_link} target="_blank" rel="noopener noreferrer">📂 Drive</a>}</td>
                                                <td>{e.approved_by}</td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {e.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Note: ${e.notes}`)}>📝</button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'expenses', data: e })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('expenses', e.id, e.entry_no)}>🗑️</button>
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
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Reimbursements</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'reimbursement' ? false : 'reimbursement')}>
                                {showAddForm === 'reimbursement' ? 'Cancel' : '+ Log Reimbursement'}
                            </button>
                        </div>

                        {showAddForm === 'reimbursement' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div className="form-group"><label>Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Member Name</label><input name="member" required /></div>
                                    <div className="form-group"><label>Related Expense (Entry No)</label><input name="ref" placeholder="EX-001" /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" required /></div>
                                    <div className="form-group"><label>Drive Link</label><input name="driveLink" placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" placeholder="Additional details..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Reimbursement</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'reimbursements' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Reimbursement</h3>
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
                                    <div className="form-group"><label>Related Expense (Entry No)</label><input name="ref" defaultValue={editingRecord.data.related_expense_entry} /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.amount} required /></div>
                                    <div className="form-group"><label>Drive Link</label><input name="driveLink" defaultValue={editingRecord.data.drive_link} placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div className="form-group"><label>Status</label>
                                        <select name="status" defaultValue={editingRecord.data.status}>
                                            <option>Pending</option>
                                            <option>Paid</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Reimbursement</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entry No</th>
                                            <th>Date</th>
                                            <th>Member Name</th>
                                            <th>Related Expense</th>
                                            <th>Amount</th>
                                            <th>Links</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reimbursements.map(r => (
                                            <tr key={r.id}>
                                                <td>{r.entry_no}</td>
                                                <td>{r.date}</td>
                                                <td>{r.member_name}</td>
                                                <td>{r.related_expense_entry}</td>
                                                <td>{formatCurrency(r.amount)}</td>
                                                <td>{r.drive_link && <a href={r.drive_link} target="_blank" rel="noopener noreferrer">📂 Drive</a>}</td>
                                                <td><span className={r.status === 'Paid' ? 'status-paid' : 'status-unpaid'}>{r.status}</span></td>
                                                <td>
                                                    <div className="actions-grid">
                                                        {r.notes && (
                                                            <button className="btn-icon" title="View Note" onClick={() => alert(`Note: ${r.notes}`)}>📝</button>
                                                        )}
                                                        <button className="btn-icon" onClick={() => setEditingRecord({ type: 'reimbursements', data: r })}>✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDelete('reimbursements', r.id)}>🗑️</button>
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
                let runningPettyBalance = 0;
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Petty Cash</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddForm(showAddForm === 'petty' ? false : 'petty')}>
                                {showAddForm === 'petty' ? 'Cancel' : '+ Petty Cash Entry'}
                            </button>
                        </div>

                        {showAddForm === 'petty' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px' }}>
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
                                    <div className="form-group"><label>Date</label><input type="date" name="date" required /></div>
                                    <div className="form-group"><label>Type</label>
                                        <select name="type">
                                            <option>Debit</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Description</label><input name="desc" required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Paid To</label><input name="paidTo" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Drive Link</label><input name="driveLink" placeholder="GDrive Link" /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" placeholder="Additional details..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Petty Cash</button></div>
                                </form>
                            </div>
                        )}

                        {editingRecord && editingRecord.type === 'petty_cash' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Petty Cash Entry</h3>
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
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Petty Cash</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Voucher</th>
                                            <th>Description</th>
                                            <th>Debit</th>
                                            <th>Credit</th>
                                            <th>Links</th>
                                            <th>Balance</th>
                                            <th>Paid To</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pettyCash.map(p => {
                                            runningPettyBalance += (p.credit || 0) - (p.debit || 0);
                                            return (
                                                <tr key={p.id}>
                                                    <td>{p.date}</td>
                                                    <td>{p.voucher_no}</td>
                                                    <td>{p.description}</td>
                                                    <td style={{ color: '#f87171' }}>{p.debit > 0 ? formatCurrency(p.debit) : '-'}</td>
                                                    <td style={{ color: '#4ade80' }}>{p.credit > 0 ? formatCurrency(p.credit) : '-'}</td>
                                                    <td>{p.drive_link && <a href={p.drive_link} target="_blank" rel="noopener noreferrer">📂 Drive</a>}</td>
                                                    <td style={{ fontWeight: 700 }}>{formatCurrency(runningPettyBalance)}</td>
                                                    <td>{p.paid_to}</td>
                                                    <td>
                                                        <div className="actions-grid">
                                                            {p.notes && (
                                                                <button className="btn-icon" title="View Note" onClick={() => alert(`Note: ${p.notes}`)}>📝</button>
                                                            )}
                                                            <button className="btn-icon" onClick={() => setEditingRecord({ type: 'petty_cash', data: p })}>✏️</button>
                                                            <button className="btn-icon" onClick={() => handleDelete('petty_cash', p.id)}>🗑️</button>
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
                let runningBankBalance = 0;
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Bank Ledger (Core Accounting)</h2>
                        </div>

                        {editingRecord && editingRecord.type === 'bank_ledger' && (
                            <div className="glass-panel card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Edit Ledger Entry</h3>
                                    <button className="btn-icon" onClick={() => setEditingRecord(null)}>✕</button>
                                </div>
                                <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                    ⚠️ Warning: Directly editing ledger entries linked to {editingRecord.data.ref_type}s is not recommended.
                                    Consider editing the original {editingRecord.data.ref_type} entry for consistency.
                                </p>
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
                                    <div className="form-group"><label>Type</label>
                                        <select name="type" defaultValue={editingRecord.data.debit > 0 ? 'Debit' : 'Credit'}>
                                            <option>Debit</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Description</label><input name="desc" defaultValue={editingRecord.data.description} required /></div>
                                    <div className="form-group"><label>Amount</label><input type="number" name="amount" defaultValue={editingRecord.data.debit > 0 ? editingRecord.data.debit : editingRecord.data.credit} required /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Notes</label><textarea name="notes" defaultValue={editingRecord.data.notes} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}></textarea></div>
                                    <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Ledger</button></div>
                                </form>
                            </div>
                        )}
                        <div className="glass-panel card">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Debit (Out)</th>
                                            <th>Credit (In)</th>
                                            <th>Balance</th>
                                            <th>Ref Type</th>
                                            <th>Ref Entry</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bankLedger.map(b => {
                                            runningBankBalance += (b.credit || 0) - (b.debit || 0);
                                            return (
                                                <tr key={b.id}>
                                                    <td>{b.date}</td>
                                                    <td>{b.description}</td>
                                                    <td style={{ color: '#f87171' }}>{b.debit > 0 ? formatCurrency(b.debit) : '-'}</td>
                                                    <td style={{ color: '#4ade80' }}>{b.credit > 0 ? formatCurrency(b.credit) : '-'}</td>
                                                    <td style={{ fontWeight: 700 }}>{formatCurrency(runningBankBalance)}</td>
                                                    <td>{b.ref_type}</td>
                                                    <td>{b.ref_entry}</td>
                                                    <td>
                                                        <div className="actions-grid">
                                                            {b.notes && (
                                                                <button className="btn-icon" title="View Note" onClick={() => alert(`Note: ${b.notes}`)}>📝</button>
                                                            )}
                                                            <button className="btn-icon" onClick={() => setEditingRecord({ type: 'bank_ledger', data: b })}>✏️</button>
                                                            <button className="btn-icon" onClick={() => handleDelete('bank_ledger', b.id)}>🗑️</button>
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
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', margin: 0 }}>Financial Overview</h1>
                            <p style={{ color: 'var(--text-dim)', marginTop: '8px' }}>Real-time tracking of society accounts and maintenance.</p>
                        </div>

                        <div className="dashboard-grid">
                            <div className="glass-panel metric-card" style={{ borderLeft: '4px solid #4ade80' }}>
                                <span className="metric-label">Maintenance Collected</span>
                                <span className="metric-value" style={{ color: '#4ade80' }}>{formatCurrency(totalMaintenanceCollected)}</span>
                            </div>
                            <div className="glass-panel metric-card" style={{ borderLeft: '4px solid #f87171' }}>
                                <span className="metric-label">Total Expenses</span>
                                <span className="metric-value" style={{ color: '#f87171' }}>{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div className="glass-panel metric-card" style={{ borderLeft: '4px solid #fbbf24' }}>
                                <span className="metric-label">Reimbursements Due</span>
                                <span className="metric-value" style={{ color: '#fbbf24' }}>{formatCurrency(totalReimbursementsPending)}</span>
                            </div>
                            <div className="glass-panel metric-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                                <span className="metric-label">Bank Balance</span>
                                <span className="metric-value" style={{ color: '#8b5cf6' }}>{formatCurrency(totalBankBalance)}</span>
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
                                <h3>Quick Actions</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                    <button className="btn btn-primary" onClick={() => setActiveTab('Receipts')}>Record New Receipt</button>
                                    <button className="btn btn-primary" style={{ background: 'var(--glass)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setActiveTab('Expenses')}>Add Expense Entry</button>
                                    <button className="btn btn-primary" style={{ background: 'var(--glass)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setActiveTab('Flat_Master')}>Manage Flats</button>
                                    <a href="#" className="btn btn-primary" style={{ background: 'var(--primary)', color: '#fff', textAlign: 'center', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">📂 Browse Society Drive</a>
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
