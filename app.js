// Configuración
const API_BASE_URL = 'https://func-backend-ivan.azurewebsites.net/api/inventoryapi';
let allProducts = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('apiUrl').textContent = API_BASE_URL;
    loadProducts();
    
    // Configurar formulario
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('searchInput').addEventListener('input', filterProducts);
});

// Cargar productos desde API
async function loadProducts() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}?op=listar`);
        const data = await response.json();
        
        if (data.estado === 'frontend_ready' || data.estado === 'exitoso') {
            allProducts = data.datos || [];
            updateProductsTable(allProducts);
            updateStats();
            showToast('✅ Inventario actualizado', `Se cargaron ${allProducts.length} productos`, 'success');
        } else {
            showToast('⚠️ Advertencia', data.mensaje || 'Error al cargar productos', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error de conexión', 'No se pudo conectar con la API', 'danger');
        // Mostrar datos de ejemplo si falla la conexión
        showExampleData();
    } finally {
        showLoading(false);
    }
}

// Actualizar tabla de productos
function updateProductsTable(products) {
    const tbody = document.getElementById('productsTable');
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="fas fa-box-open fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No hay productos en el inventario</p>
                    <button class="btn btn-primary" onclick="resetForm()">
                        <i class="fas fa-plus me-2"></i>Agregar primer producto
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const stockClass = getStockClass(product.Cantidad);
        const typeClass = `badge-${product.Tipo.toLowerCase().replace(/[^a-z]/g, '')}`;
        
        html += `
            <tr class="product-card ${stockClass}">
                <td>
                    <strong>${product.Nombre}</strong>
                    <div class="small text-muted">ID: ${product.RowKey.substring(0, 8)}...</div>
                </td>
                <td>
                    <span class="badge ${typeClass}">${product.Tipo}</span>
                </td>
                <td>
                    <span class="badge quantity-badge ${getQuantityBadgeClass(product.Cantidad)}">
                        ${product.Cantidad} unidades
                    </span>
                </td>
                <td>
                    <strong>$${parseFloat(product.Precio).toFixed(2)}</strong>
                </td>
                <td>
                    <span class="badge bg-secondary">${product.Ubicacion}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" 
                                onclick="editProduct('${product.RowKey}', '${product.Nombre.replace(/'/g, "\\'")}', '${product.Tipo}', ${product.Cantidad}, ${product.Precio}, '${product.Ubicacion}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" 
                                onclick="deleteProduct('${product.RowKey}', '${product.Nombre.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Manejar envío del formulario
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const isEdit = productId !== '';
    
    const productData = {
        nombre: document.getElementById('productName').value,
        tipo: document.getElementById('productType').value,
        cantidad: parseInt(document.getElementById('productQuantity').value),
        precio: parseFloat(document.getElementById('productPrice').value),
        ubicacion: document.getElementById('productLocation').value
    };
    
    showLoading(true);
    
    try {
        let url, method;
        
        if (isEdit) {
            url = `${API_BASE_URL}?op=actualizar&id=${productId}`;
            method = 'PUT';
        } else {
            url = `${API_BASE_URL}?op=crear`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('✅ Éxito', result.mensaje || 'Operación completada', 'success');
            resetForm();
            loadProducts(); // Recargar lista
        } else {
            showToast('❌ Error', result.mensaje || 'Error en la operación', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error de conexión', 'No se pudo completar la operación', 'danger');
    } finally {
        showLoading(false);
    }
}

// Editar producto
function editProduct(id, nombre, tipo, cantidad, precio, ubicacion) {
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = nombre;
    document.getElementById('productType').value = tipo;
    document.getElementById('productQuantity').value = cantidad;
    document.getElementById('productPrice').value = precio;
    document.getElementById('productLocation').value = ubicacion;
    
    document.getElementById('btnText').textContent = 'Guardar Cambios';
    document.getElementById('submitBtn').className = 'btn btn-warning';
    
    // Scroll al formulario
    document.getElementById('productName').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast('📝 Modo edición', `Editando: ${nombre}`, 'info');
}

// Eliminar producto
async function deleteProduct(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}?op=eliminar&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('✅ Eliminado', result.mensaje || 'Producto eliminado', 'success');
            loadProducts(); // Recargar lista
        } else {
            showToast('❌ Error', result.mensaje || 'Error al eliminar', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error de conexión', 'No se pudo eliminar el producto', 'danger');
    } finally {
        showLoading(false);
    }
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    let filtered = allProducts;
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.Nombre.toLowerCase().includes(searchTerm) || 
            p.Ubicacion.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterType) {
        filtered = filtered.filter(p => p.Tipo === filterType);
    }
    
    updateProductsTable(filtered);
}

// Actualizar estadísticas
function updateStats() {
    const totalProducts = allProducts.length;
    const totalValue = allProducts.reduce((sum, p) => sum + (p.Precio * p.Cantidad), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalValue').textContent = totalValue.toFixed(2);
}

// Resetear formulario
function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('btnText').textContent = 'Agregar Producto';
    document.getElementById('submitBtn').className = 'btn btn-primary';
}

// Mostrar/Ocultar loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

// Mostrar toast
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Configurar colores según tipo
    const typeColors = {
        'success': 'text-bg-success',
        'danger': 'text-bg-danger',
        'warning': 'text-bg-warning',
        'info': 'text-bg-info'
    };
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Limpiar clases anteriores y agregar nueva
    toastEl.className = 'toast';
    toastEl.classList.add(typeColors[type] || 'text-bg-info');
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Funciones auxiliares
function getStockClass(quantity) {
    if (quantity === 0) return 'low-stock';
    if (quantity < 5) return 'low-stock';
    if (quantity < 10) return 'medium-stock';
    return 'high-stock';
}

function getQuantityBadgeClass(quantity) {
    if (quantity === 0) return 'bg-danger';
    if (quantity < 5) return 'bg-warning text-dark';
    if (quantity < 10) return 'bg-info';
    return 'bg-success';
}

// Mostrar datos de ejemplo si falla la conexión
function showExampleData() {
    const exampleProducts = [
        {
            RowKey: 'ej-1',
            Nombre: 'Laptop HP EliteBook',
            Tipo: 'Electrónica',
            Cantidad: 3,
            Precio: 1299.99,
            Ubicacion: 'Estante A'
        },
        {
            RowKey: 'ej-2',
            Nombre: 'Camiseta Casual',
            Tipo: 'Ropa',
            Cantidad: 15,
            Precio: 24.99,
            Ubicacion: 'Mostrador'
        }
    ];
    
    updateProductsTable(exampleProducts);
    document.getElementById('totalProducts').textContent = exampleProducts.length;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Modo demostración:</strong> Conectando a Azure Functions...
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.inventory-card').prepend(alertDiv);
}
