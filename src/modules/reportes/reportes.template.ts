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
            text-transform: capitalize;
        }
        .status-entregada { background-color: #d1fae5; color: #065f46; }
        .status-en_espera { background-color: #fef3c7; color: #92400e; }
        .status-pagado { background-color: #dbeafe; color: #1e40af; }
        .status-pendiente_pago, .status-pendiente { background-color: #fee2e2; color: #991b1b; }
        .status-parcial { background-color: #fef3c7; color: #92400e; }
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
        @page {
            margin: 0;
        }
        @media print {
            body { 
                background-color: #fff; 
                padding: 15mm; 
            }
            .container { 
                box-shadow: none; 
                padding: 0; 
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reporte de Entregas de Proveedores</h1>
            <p>Generado el <%= new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) %></p>
        </div>

        <div class="filters-info">
            <strong>Filtros aplicados:</strong><br>
            Fecha Inicio: <%= filtros.fechaInicio ? (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(filtros.fechaInicio)) : 'N/A' %> | 
            Fecha Fin: <%= filtros.fechaFin ? (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(filtros.fechaFin)) : 'N/A' %><br>
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
                        <th>Producto</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <% let granTotal = 0; %>
                    <% entregas.forEach(function(entrega) { %>
                        <% granTotal += Number(entrega.totalCosto); %>
                        <% const rowspan = Math.max(1, entrega.items ? entrega.items.length : 1); %>
                        <tr>
                            <td rowspan="<%= rowspan %>"><%= (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(entrega.createdAt)) %></td>
                            <td rowspan="<%= rowspan %>"><%= entrega.proveedor ? entrega.proveedor.name : 'Desconocido' %></td>
                            <td rowspan="<%= rowspan %>">
                                <span class="status status-<%= entrega.estadoEntrega %>">
                                    <%= entrega.estadoEntrega === 'entregada' ? 'Entregada' : 'En Espera' %>
                                </span>
                            </td>
                            <td rowspan="<%= rowspan %>">
                                <span class="status status-<%= entrega.estadoPago %>">
                                    <%= entrega.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente' %>
                                </span>
                            </td>
                            <% if (entrega.items && entrega.items.length > 0) { %>
                                <td><%= entrega.items[0].producto ? entrega.items[0].producto.nombre : 'Producto' %></td>
                                <td class="text-center"><%= entrega.items[0].cantidad %></td>
                            <% } else { %>
                                <td>-</td>
                                <td class="text-center">-</td>
                            <% } %>
                            <td rowspan="<%= rowspan %>" class="text-right"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(entrega.totalCosto)) %></td>
                        </tr>
                        <% if (entrega.items && entrega.items.length > 1) { %>
                            <% for (let i = 1; i < entrega.items.length; i++) { %>
                                <tr>
                                    <td><%= entrega.items[i].producto ? entrega.items[i].producto.nombre : 'Producto' %></td>
                                    <td class="text-center"><%= entrega.items[i].cantidad %></td>
                                </tr>
                            <% } %>
                        <% } %>
                    <% }); %>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="6" class="text-right">Total General:</td>
                        <td class="text-right"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(granTotal) %></td>
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

export const reporteVentasTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Ventas</title>
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
            font-size: 13px;
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
        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
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
        .light-text {
            color: #6b7280;
            font-style: italic;
        }
        @page {
            margin: 0;
        }
        @media print {
            body { 
                background-color: #fff; 
                padding: 15mm; 
            }
            .container { 
                box-shadow: none; 
                padding: 0; 
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reporte de Ventas</h1>
            <p>Generado el <%= new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) %></p>
        </div>

        <div class="filters-info">
            <strong>Filtros aplicados:</strong><br>
            Fecha Inicio: <%= filtros.fechaInicio ? (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(filtros.fechaInicio)) : 'N/A' %> | 
            Fecha Fin: <%= filtros.fechaFin ? (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(filtros.fechaFin)) : 'N/A' %><br>
            Métodos de Pago: 
            <%= (filtros.metodosPago && filtros.metodosPago.length > 0) ? filtros.metodosPago.join(', ') : 'Todos' %>
        </div>

        <% if (ventas && ventas.length > 0) { %>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Factura</th>
                        <th>Cliente</th>
                        <th>Método</th>
                        <th>Productos (Cant)</th>
                        <th class="text-right">Subtotal</th>
                        <th class="text-right">Descuento</th>
                        <th class="text-right">ITBIS</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <% 
                        let granSubtotal = 0; 
                        let granDescuento = 0;
                        let granImpuesto = 0;
                        let granTotal = 0; 
                    %>
                    <% ventas.forEach(function(venta) { %>
                        <% 
                            granSubtotal += Number(venta.subtotal); 
                            granDescuento += Number(venta.descuento || 0);
                            granImpuesto += Number(venta.impuesto || 0);
                            granTotal += Number(venta.total); 
                        %>
                        <tr>
                            <td><%= (function(d){ const pad=n=>n.toString().padStart(2,'0'); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear() })(new Date(venta.createdAt)) %></td>
                            <td><%= venta.factura %></td>
                            <td><%= venta.clienteNombre || 'Cliente General' %></td>
                            <td style="text-transform: capitalize;"><%= venta.metodoPago === 'uberEats' ? 'UberEats' : venta.metodoPago %></td>
                            <td>
                                <% if (venta.items && venta.items.length > 0) { %>
                                    <ul style="margin: 0; padding-left: 15px;">
                                    <% venta.items.forEach(function(item) { %>
                                        <li><%= item.producto ? item.producto.nombre : 'Producto' %> (<%= item.cantidad %>)</li>
                                    <% }); %>
                                    </ul>
                                <% } else { %>
                                    -
                                <% } %>
                            </td>
                            <td class="text-right"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(venta.subtotal)) %></td>
                            <td class="text-right"><%- (venta.descuento > 0) ? ('RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(venta.descuento))) : '<span class="light-text">Ninguno</span>' %></td>
                            <td class="text-right"><%- (venta.impuesto > 0) ? ('RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(venta.impuesto))) : '<span class="light-text">Ninguno</span>' %></td>
                            <td class="text-right" style="font-weight: bold;"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(venta.total)) %></td>
                        </tr>
                    <% }); %>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="5" class="text-right">Totales Generales:</td>
                        <td class="text-right"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(granSubtotal) %></td>
                        <td class="text-right"><%- (granDescuento > 0) ? ('RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(granDescuento)) : '<span class="light-text">Ninguno</span>' %></td>
                        <td class="text-right"><%- (granImpuesto > 0) ? ('RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(granImpuesto)) : '<span class="light-text">Ninguno</span>' %></td>
                        <td class="text-right"><%= 'RD$ ' + new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(granTotal) %></td>
                    </tr>
                </tfoot>
            </table>
        <% } else { %>
            <div class="no-data">
                No se encontraron ventas con los filtros especificados.
            </div>
        <% } %>

        <div class="footer">
            Bizcochao Pastelería - Sistema de Facturación
        </div>
    </div>
</body>
</html>
`;;
