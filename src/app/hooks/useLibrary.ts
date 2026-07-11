import { useState, useEffect } from 'react';

export function useLibrary() {
  const [files, setFiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Geri Dönüşüm Kutusu (Trash) State
  const [viewMode, setViewMode] = useState<'library' | 'trash'>('library');
  const [trashedFiles, setTrashedFiles] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // Kategori Düzenleme State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Yükleme Modalı State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Dosya Yeniden Adlandırma State
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Dosya Taşıma State
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const [movingFileCategoryId, setMovingFileCategoryId] = useState('');
  const [isMovingFile, setIsMovingFile] = useState(false);

  // Klasör Taşıma State
  const [movingCategoryId, setMovingCategoryId] = useState<string | null>(null);
  const [movingCategoryParentId, setMovingCategoryParentId] = useState('');
  const [isMovingCategory, setIsMovingCategory] = useState(false);

  // Dosya Yeniden Adlandırma İşlemi
  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFileId || !renamingFileName.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renamingFileId, name: renamingFileName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Dosya adı başarıyla güncellendi!');
        setFiles(fs => fs.map(f => f.id === renamingFileId ? { ...f, name: renamingFileName.trim() } : f));
        setRenamingFileId(null);
        setRenamingFileName('');
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Yeniden adlandırma sırasında bir hata oluştu.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Dosya Taşıma İşlemi
  const handleMoveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingFileId) return;
    setIsMovingFile(true);
    try {
      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: movingFileId, categoryId: movingFileCategoryId || null }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Dosya başarıyla taşındı!');
        setFiles(fs => fs.map(f => f.id === movingFileId ? { ...f, categoryId: movingFileCategoryId } : f));
        setMovingFileId(null);
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Dosya taşınırken bir hata oluştu.');
    } finally {
      setIsMovingFile(false);
    }
  };

  // Alt kategorileri bul
  const getDescendants = (catId: string, allCats: any[]): string[] => {
    const children = allCats.filter(c => c.parentId === catId);
    let descendants = children.map(c => c.id);
    children.forEach(c => {
      descendants = [...descendants, ...getDescendants(c.id, allCats)];
    });
    return descendants;
  };

  // Klasör Taşıma İşlemi
  const handleMoveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingCategoryId) return;
    setIsMovingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: movingCategoryId,
          parentId: movingCategoryParentId || null
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Klasör başarıyla taşındı!');
        setCategories(cats => cats.map(c => c.id === movingCategoryId ? { ...c, parentId: movingCategoryParentId || null } : c));
        setMovingCategoryId(null);
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Klasör taşınırken bir hata oluştu.');
    } finally {
      setIsMovingCategory(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    Promise.all([
      fetch('/api/files').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
    ])
      .then(([filesData, catData]) => {
        if (filesData.files) setFiles(filesData.files);
        if (catData.categories) setCategories(catData.categories);
      })
      .catch(err => console.error('Veri çekme hatası:', err))
      .finally(() => setLoading(false));
  }, []);

  // Çöpü yükle
  const loadTrash = () => {
    setTrashLoading(true);
    fetch('/api/files?trash=true')
      .then(res => res.json())
      .then(data => { if (data.files) setTrashedFiles(data.files); })
      .catch(err => console.error('Çöp çekme hatası:', err))
      .finally(() => setTrashLoading(false));
  };

  useEffect(() => {
    if (viewMode === 'trash') loadTrash();
  }, [viewMode]);

  // Dosyayı çöpe at
  const handleTrash = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bu dosyayı geri dönüşüm kutusuna taşımak istiyor musunuz?')) return;

    try {
      const res = await fetch(`/api/files?id=${id}&action=trash`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFiles(fs => fs.filter(f => f.id !== id));
      } else {
        alert('Hata: ' + (data.error || 'Dosya taşınamadı.'));
      }
    } catch {
      alert('İşlem sırasında bir hata oluştu.');
    }
  };

  // Çöpten geri al
  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/files?id=${id}&action=restore`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTrashedFiles(fs => fs.filter(f => f.id !== id));
        fetch('/api/files').then(r => r.json()).then(d => { if (d.files) setFiles(d.files); });
      } else {
        alert('Hata: ' + (data.error || 'Geri yüklenemedi.'));
      }
    } catch {
      alert('Geri yükleme sırasında hata oluştu.');
    }
  };

  // Kalıcı sil
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Bu dosya kalıcı olarak silinecek ve kurtarılamayacak. Emin misiniz?')) return;
    try {
      const res = await fetch(`/api/files?id=${id}&action=permanent`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTrashedFiles(fs => fs.filter(f => f.id !== id));
      } else {
        alert('Hata: ' + (data.error || 'Silinemedi.'));
      }
    } catch {
      alert('Silme işlemi sırasında hata oluştu.');
    }
  };

  // Kategori adı kaydet
  const handleSaveCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, name: editingCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(cats => cats.map(c => c.id === id ? { ...c, name: editingCategoryName.trim() } : c));
        setEditingCategoryId(null);
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Kategori güncellenirken hata oluştu.');
    }
  };

  // Yeni kategori / alt kategori ekle
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          name: newCategoryName.trim(),
          parentId: selectedCategory || null
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(cats => [...cats, data.category]);
        setNewCategoryName('');
        setShowAddCategory(false);
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Kategori eklenirken hata oluştu.');
    }
  };

  // Kategori sil
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" klasörünü silmek istiyor musunuz?\nİçindeki dosyalar "Diğer" klasörüne taşınacak.`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCategories(cats => cats.filter(c => c.id !== id).map(c => c.parentId === id ? { ...c, parentId: null } : c));
        if (selectedCategory === id) setSelectedCategory('');
        setFiles(fs => fs.map(f => f.categoryId === id ? { ...f, categoryId: 'diger' } : f));
        if (data.movedCount > 0) {
          alert(`${data.movedCount} dosya "Diğer" klasörüne taşındı.`);
        }
        if (!categories.some(c => c.id === 'diger')) {
          setCategories(cats => [...cats, { id: 'diger', name: 'Diğer', parentId: null }]);
        }
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Klasör silinirken hata oluştu.');
    }
  };

  const handleOpenUploadModal = () => {
    setUploadCategory(selectedCategory || '');
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || !uploadCategory || !uploadDate) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName);
    formData.append('categoryId', uploadCategory);
    formData.append('date', uploadDate);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        alert('Dosya başarıyla yüklendi!');
        setIsUploadModalOpen(false);
        setUploadName(''); setUploadCategory(''); setUploadDate(''); setUploadFile(null);
        fetch('/api/files').then(r => r.json()).then(d => { if (d.files) setFiles(d.files); });
      } else {
        alert('Hata: ' + data.error);
      }
    } catch {
      alert('Yükleme sırasında bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const getBreadcrumbs = (catId: string) => {
    const breadcrumbs: any[] = [];
    let currentId: string | null = catId;
    while (currentId) {
      const cat = categories.find(c => c.id === currentId);
      if (cat) {
        breadcrumbs.unshift(cat);
        currentId = cat.parentId || null;
      } else {
        break;
      }
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(selectedCategory);

  const filteredSidebarCategories = categories.filter(cat => {
    if (!categorySearchQuery) return true;
    return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
  });

  const currentCategories = categories.filter(cat => {
    if (!selectedCategory) return !cat.parentId;
    return cat.parentId === selectedCategory;
  });

  const filteredFiles = files.filter(file => {
    const matchesCat = selectedCategory ? file.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCat && matchesSearch;
  });

  return {
    files, setFiles,
    categories, setCategories,
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
    categorySearchQuery, setCategorySearchQuery,
    loading, setLoading,
    viewMode, setViewMode,
    trashedFiles, setTrashedFiles,
    trashLoading, setTrashLoading,
    editingCategoryId, setEditingCategoryId,
    editingCategoryName, setEditingCategoryName,
    newCategoryName, setNewCategoryName,
    showAddCategory, setShowAddCategory,
    isUploadModalOpen, setIsUploadModalOpen,
    uploadName, setUploadName,
    uploadCategory, setUploadCategory,
    uploadDate, setUploadDate,
    uploadFile, setUploadFile,
    isUploading, setIsUploading,
    renamingFileId, setRenamingFileId,
    renamingFileName, setRenamingFileName,
    isRenaming, setIsRenaming,
    movingFileId, setMovingFileId,
    movingFileCategoryId, setMovingFileCategoryId,
    isMovingFile, setIsMovingFile,
    movingCategoryId, setMovingCategoryId,
    movingCategoryParentId, setMovingCategoryParentId,
    isMovingCategory, setIsMovingCategory,

    handleRenameFile, handleMoveFile, handleMoveCategory, handleTrash,
    handleRestore, handlePermanentDelete, handleSaveCategory, handleAddCategory,
    handleDeleteCategory, handleOpenUploadModal, handleUpload, getBreadcrumbs,
    getDescendants, filteredSidebarCategories, currentCategories, filteredFiles,
    breadcrumbs
  };
}

export type LibraryState = ReturnType<typeof useLibrary>;
