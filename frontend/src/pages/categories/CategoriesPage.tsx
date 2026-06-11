import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';
import type { Category } from '../../types';

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal = ({ category, onClose, onSave }: CategoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: category?.name ?? '',
    breakfastCost: category?.breakfastCost ?? 0,
    lunchCost: category?.lunchCost ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, form);
      } else {
        await api.post('/categories', form);
      }
      onSave();
      onClose();
    } catch {
      setError('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '32px',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            {category ? 'Editar categoría' : 'Agregar categoría'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Nombre', name: 'name', type: 'text', value: form.name },
            { label: 'Costo desayuno (₡)', name: 'breakfastCost', type: 'number', value: form.breakfastCost },
            { label: 'Costo almuerzo (₡)', name: 'lunchCost', type: 'number', value: form.lunchCost },
          ].map((field) => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{field.label}</label>
              <input
                name={field.name} type={field.type} value={field.value} onChange={handleChange}
                style={{
                  width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none',
                }}
              />
            </div>
          ))}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
            border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer',
          }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch {
      alert('No se puede eliminar una categoría con empleados asignados');
    }
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Categorías</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Gestión de categorías y costos de tiquetes</p>
        </div>
        <button onClick={handleAdd} style={{
          backgroundColor: '#0f172a', color: 'white', border: 'none',
          borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
          fontWeight: 500, cursor: 'pointer',
        }}>
          + Agregar categoría
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>Cargando...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {categories.map((category) => (
            <div key={category.id} style={{
              backgroundColor: '#f8fafc', borderRadius: '12px',
              border: '2px solid #0f172a', padding: '28px 32px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{category.name}</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleEdit(category)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2563eb', fontSize: '13px', fontWeight: 500,
                  }}>Editar</button>
                  <button onClick={() => handleDelete(category.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#dc2626', fontSize: '13px', fontWeight: 500,
                  }}>Eliminar</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Desayuno</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>₡{category.breakfastCost.toLocaleString()}</span>
                </div>
                <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Almuerzo</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>₡{category.lunchCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => setShowModal(false)}
          onSave={fetchCategories}
        />
      )}
    </MainLayout>
  );
};

export default CategoriesPage;