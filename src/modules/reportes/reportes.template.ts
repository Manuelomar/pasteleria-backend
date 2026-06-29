export const reporteProveedorTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Proveedores</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f9fafb;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #111827;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0 0;
            color: #6b7280;
            font-size: 14px;
        }
        .filters-info {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .filters-info strong {
            color: #374151;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #4b5563;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.05em;
        }
        tr:hover {
            background-color: #f9fafb;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-entregada { background-color: #d1fae5; color: #065f46; }
        .status-en_espera { background-color: #fef3c7; color: #92400e; }
        .status-pagado { background-color: #dbeafe; color: #1e40af; }
        .status-pendiente_pago { background-color: #fee2e2; color: #991b1b; }
        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        .text-right {
            text-align: right;
        }
        .items-list {
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #4b5563;
        }
        .items-list li {
            margin-bottom: 4px;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-style: italic;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #9ca3af;
        }
        @media print {
            body { background-color: #fff; }
            .container { box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reporte de Entregas de Proveedores</h1>
            <p>Generado el <%= new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) %></p>
        </div>

        <div class="filters-info">
            <strong>Filtros aplicados:</strong><br>
            Fecha Inicio: <%= filtros.fechaInicio ? new Date(filtros.fechaInicio).toLocaleDateString() : 'N/A' %> | 
            Fecha Fin: <%= filtros.fechaFin ? new Date(filtros.fechaFin).toLocaleDateString() : 'N/A' %><br>
            Estados: 
            <%= filtros.entregado ? '[x] Entregado ' : '' %>
            <%= filtros.noPagado ? '[x] No Pagado ' : '' %>
            <%= filtros.finalizado ? '[x] Finalizado ' : '' %>
            <%= (!filtros.entregado && !filtros.noPagado && !filtros.finalizado) ? 'Todos' : '' %>
        </div>

        <% if (entregas && entregas.length > 0) { %>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Proveedor</th>
                        <th>Estado Entrega</th>
                        <th>Estado Pago</th>
                        <th>Items</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <% let granTotal = 0; %>
                    <% entregas.forEach(function(entrega) { %>
                        <% granTotal += Number(entrega.totalCosto); %>
                        <tr>
                            <td><%= new Date(entrega.createdAt).toLocaleDateString() %></td>
                            <td><%= entrega.proveedor ? entrega.proveedor.nombre : 'Desconocido' %></td>
                            <td>
                                <span class="status status-<%= entrega.estadoEntrega %>">
                                    <%= entrega.estadoEntrega === 'entregada' ? 'Entregada' : 'En Espera' %>
                                </span>
                            </td>
                            <td>
                                <span class="status status-<%= entrega.estadoPago %>">
                                    <%= entrega.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente' %>
                                </span>
                            </td>
                            <td>
                                <% if (entrega.items && entrega.items.length > 0) { %>
                                    <ul class="items-list">
                                        <% entrega.items.forEach(function(item) { %>
                                            <li><%= item.cantidad %>x <%= item.producto ? item.producto.nombre : 'Producto' %></li>
                                        <% }); %>
                                    </ul>
                                <% } else { %>
                                    -
                                <% } %>
                            </td>
                            <td class="text-right">$<%= Number(entrega.totalCosto).toFixed(2) %></td>
                        </tr>
                    <% }); %>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="5" class="text-right">Total General:</td>
                        <td class="text-right">$<%= granTotal.toFixed(2) %></td>
                    </tr>
                </tfoot>
            </table>
        <% } else { %>
            <div class="no-data">
                No se encontraron entregas con los filtros especificados.
            </div>
        <% } %>

        <div class="footer">
            Bizcochao Pastelería - Sistema de Facturación
        </div>
    </div>
</body>
</html>
`;
