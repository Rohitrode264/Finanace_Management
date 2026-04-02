import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageHeader } from '../../components/ui/PageHeader';
import { Plus, Power } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoryService } from '../../api/services/category.service';
import { usePermission } from '../../hooks/usePermission';
import { TruncatedText } from '../../components/ui/TruncatedText';
import toast from 'react-hot-toast';

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

export function CategoriesPage() {
    const qc = useQueryClient();
    const canCreate = usePermission('CREATE_CLASS'); // Used generic CREATE_CLASS permission

    const { data: catRes, isLoading } = useQuery({
        queryKey: ['categories-all'],
        queryFn: () => categoryService.list(true), // get all including inactive
    });

    const categories = catRes?.data?.data || [];
    const [showForm, setShowForm] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>({
        resolver: zodResolver(categorySchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: CategoryForm) => categoryService.create(data),
        onSuccess: () => {
            toast.success('Program category created successfully');
            reset();
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['categories'] });
            qc.invalidateQueries({ queryKey: ['categories-all'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create category'),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => categoryService.toggleStatus(id),
        onSuccess: () => {
            toast.success('Category status updated');
            qc.invalidateQueries({ queryKey: ['categories'] });
            qc.invalidateQueries({ queryKey: ['categories-all'] });
        },
        onError: () => toast.error('Failed to update status'),
    });

    return (
        <div>
            <PageHeader
                title="Program Categories"
                subtitle="Manage available programs that students can enroll in (e.g. JEE, NEET)."
                actions={
                    canCreate && !showForm ? (
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            <Plus size={15} /> Add Category
                        </button>
                    ) : undefined
                }
            />

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 20 }}>Create New Category</h3>
                    <form onSubmit={handleSubmit(d => createMutation.mutate(d))}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: 16 }}>
                            <div>
                                <label className="form-label">Name *</label>
                                <input {...register('name')} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Foundation" />
                                {errors.name && <p className="form-error">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <input {...register('description')} className="form-input" placeholder="Optional description..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                                {createMutation.isPending ? 'Creating...' : 'Create Program Category'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                {canCreate && <th style={{ textAlign: 'right' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Loading categories...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No categories created yet. Click above to add one.</td></tr>
                            ) : (
                                categories.map(cat => (
                                    <tr key={cat._id}>
                                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            <TruncatedText text={cat.description || '—'} maxWidth="300px" modalTitle="Category Description" />
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                                background: cat.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: cat.isActive ? '#10b981' : '#ef4444'
                                            }}>
                                                {cat.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        {canCreate && (
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => toggleMutation.mutate(cat._id)}
                                                    className="btn-secondary"
                                                    style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <Power size={13} /> {cat.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
