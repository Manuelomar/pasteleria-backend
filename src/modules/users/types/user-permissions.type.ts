export interface UserPermissions {
    clientes: boolean;
    clientes_crear: boolean;
    clientes_editar: boolean;
    clientes_eliminar: boolean;

    catalogo: boolean;
    catalogo_crear: boolean;
    catalogo_editar: boolean;
    catalogo_eliminar: boolean;

    ventas: boolean;
    ventas_crear: boolean;
    ventas_editar: boolean;
    ventas_eliminar: boolean;
    ventas_registrarPago: boolean;

    graficos: boolean;
    graficos_filtroAmbos: boolean;
    graficos_filtroConItbis: boolean;
    graficos_filtroSinItbis: boolean;

    estadoCuenta: boolean;
    estadoCuenta_exportar: boolean;
    estadoCuenta_filtros: boolean;
}
