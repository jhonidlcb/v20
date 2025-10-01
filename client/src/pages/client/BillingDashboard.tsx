
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  DollarSign,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Receipt,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  projectName: string;
  amount: number | string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  downloadUrl?: string;
  stageName?: string;
  stagePercentage?: number;
  type?: 'stage_payment' | 'traditional';
}

interface BillingData {
  currentBalance: number;
  totalPaid: number;
  pendingPayments: number;
  nextPaymentDue?: string;
}

export default function BillingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Obtener tipo de cambio actual
  const { data: exchangeRate } = useQuery({
    queryKey: ["/api/exchange-rate"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/exchange-rate");
        if (!response.ok) {
          throw new Error('Error al cargar tipo de cambio');
        }
        return await response.json();
      } catch (error) {
        console.error("Error loading exchange rate:", error);
        return { usdToGuarani: "7300.00", isDefault: true };
      }
    },
    retry: 1,
    staleTime: 300000, // 5 minutos
  });

  const { data: billingData, isLoading: billingLoading, error: billingError } = useQuery({
    queryKey: ["/api/client/billing"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/client/billing");
        if (!response.ok) {
          throw new Error('Error al cargar datos de facturación');
        }
        return await response.json();
      } catch (error) {
        console.error("Error loading billing data:", error);
        // Return fallback data instead of throwing
        return {
          currentBalance: 0,
          totalPaid: 0,
          pendingPayments: 0,
          nextPaymentDue: null
        };
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ["/api/client/invoices"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/client/invoices");
        if (!response.ok) {
          throw new Error('Error al cargar facturas');
        }
        return await response.json();
      } catch (error) {
        console.error("Error loading invoices:", error);
        // Return empty array instead of throwing
        return [];
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      let downloadUrl = `/api/client/invoices/${invoice.id}/download`;

      // Si es una factura de etapa de pago, usar endpoint específico
      if (invoice.type === 'stage_payment') {
        downloadUrl = `/api/client/stage-invoices/${invoice.id}/download`;
      }

      const response = await apiRequest("GET", downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoftwarePar_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Factura descargada",
        description: `Factura ${invoice.invoiceNumber} descargada exitosamente`,
      });
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "❌ Error al descargar",
        description: error.message || "No se pudo descargar la factura",
        variant: "destructive",
      });
    }
  };

  const downloadResimple = async (invoice: Invoice) => {
    try {
      const downloadUrl = `/api/client/stage-invoices/${invoice.id}/download-resimple`;

      const response = await apiRequest("GET", downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoftwarePar_Boleta_RESIMPLE_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Boleta RESIMPLE descargada",
        description: `Boleta RESIMPLE para ${invoice.invoiceNumber} descargada exitosamente`,
      });
    } catch (error: any) {
      console.error("Error downloading RESIMPLE:", error);
      toast({
        title: "❌ Error al descargar",
        description: error.message || "No se pudo descargar la Boleta RESIMPLE",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  // Handle loading state
  if (billingLoading || invoicesLoading) {
    return (
      <DashboardLayout title="Facturación">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Cargando datos de facturación...</p>
            <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (billingError && invoicesError) {
    return (
      <DashboardLayout title="Facturación">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">Error al cargar los datos de facturación</p>
          <Button onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/client/billing"] });
            queryClient.invalidateQueries({ queryKey: ["/api/client/invoices"] });
          }}>
            Intentar de nuevo
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Use safe fallback data
  const billing: BillingData = billingData || {
    currentBalance: 0,
    totalPaid: 0,
    pendingPayments: 0,
    nextPaymentDue: null,
  };

  const invoiceList: Invoice[] = Array.isArray(invoices) ? invoices : [];

  // Función para convertir USD a PYG usando el tipo de cambio actual
  const convertUsdToPyg = (usdAmount: number): number => {
    const rate = exchangeRate ? parseFloat(exchangeRate.usdToGuarani) : 7300;
    return Math.round(usdAmount * rate);
  };

  return (
    <DashboardLayout title="Facturación y Pagos">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Facturación y Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas, métodos de pago y historial de transacciones
          </p>
        </div>

        {/* Billing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Balance Actual</p>
                    <p className="text-2xl font-bold text-foreground">
                      USD {(billing.currentBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Pagado</p>
                    <p className="text-2xl font-bold text-foreground">
                      USD {(billing.totalPaid || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pagos Pendientes</p>
                    <p className="text-2xl font-bold text-foreground">
                      USD {(billing.pendingPayments || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Próximo Vencimiento</p>
                    <p className="text-2xl font-bold text-foreground">
                      {billing.nextPaymentDue
                        ? new Date(billing.nextPaymentDue).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Error Messages (if any partial errors) */}
        {(billingError || invoicesError) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                Algunos datos pueden no estar actualizados. 
                {billingError && " Error cargando estadísticas."}
                {invoicesError && " Error cargando facturas."}
              </p>
            </div>
          </div>
        )}

        {/* Facturas Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mis Facturas</span>
              <Badge variant="outline">
                {invoiceList.filter(inv => inv.status === 'pending').length} pendientes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceList.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes facturas disponibles</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceList.map((invoice: Invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            {invoice.type === 'stage_payment' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Etapa: {invoice.stageName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.projectName}</div>
                            {invoice.type === 'stage_payment' && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Pago por Etapa
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {invoice.stagePercentage}% del proyecto
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          <div>
                            <div>
                              {typeof invoice.amount === 'string' 
                                ? `USD ${parseFloat(invoice.amount || '0').toLocaleString()}` 
                                : `USD ${(invoice.amount || 0).toLocaleString()}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {typeof invoice.amount === 'string' 
                                ? `PYG ${convertUsdToPyg(parseFloat(invoice.amount || '0')).toLocaleString('es-PY')}` 
                                : `PYG ${convertUsdToPyg(invoice.amount || 0).toLocaleString('es-PY')}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(invoice.status)}>
                            {getStatusText(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.paidAt 
                            ? new Date(invoice.paidAt).toLocaleDateString()
                            : new Date(invoice.dueDate).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedInvoice(invoice)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => invoice.type === 'stage_payment' ? downloadResimple(invoice) : downloadInvoice(invoice)}
                              title={invoice.type === 'stage_payment' ? "Descargar Boleta RESIMPLE" : "Descargar Factura"}
                              className="text-xs"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {invoice.type === 'stage_payment' ? 'RESIMPLE' : 'PDF'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle de Factura</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <InvoiceDetailView 
                invoice={selectedInvoice} 
                onDownloadInvoice={downloadInvoice}
                onDownloadResimple={downloadResimple}
                exchangeRate={exchangeRate}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function InvoiceDetailView({ invoice, onDownloadInvoice, onDownloadResimple, exchangeRate }: { 
  invoice: Invoice;
  onDownloadInvoice: (invoice: Invoice) => void;
  onDownloadResimple: (invoice: Invoice) => void;
  exchangeRate?: any;
}) {
  // Función para convertir USD a PYG usando el tipo de cambio actual
  const convertUsdToPyg = (usdAmount: number): number => {
    const rate = exchangeRate ? parseFloat(exchangeRate.usdToGuarani) : 7300;
    return Math.round(usdAmount * rate);
  };

  return (
    <div className="space-y-4">
      {invoice.type === 'stage_payment' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Factura de Etapa de Pago
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-600">Etapa:</span>
              <p className="font-medium">{invoice.stageName}</p>
            </div>
            <div>
              <span className="text-blue-600">Porcentaje:</span>
              <p className="font-medium">{invoice.stagePercentage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Número de Factura</label>
          <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Estado</label>
          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
            {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        </div>
        <div>
          <label className="text-sm font-medium">Proyecto</label>
          <p>{invoice.projectName}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Monto</label>
          <div>
            <p className="text-lg font-bold">
              {typeof invoice.amount === 'string' 
                ? `USD ${parseFloat(invoice.amount || '0').toLocaleString()}` 
                : `USD ${(invoice.amount || 0).toLocaleString()}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {typeof invoice.amount === 'string' 
                ? `PYG ${convertUsdToPyg(parseFloat(invoice.amount || '0')).toLocaleString('es-PY')}` 
                : `PYG ${convertUsdToPyg(invoice.amount || 0).toLocaleString('es-PY')}`}
            </p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Fecha de Creación</label>
          <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm font-medium">
            {invoice.paidAt ? 'Fecha de Pago' : 'Fecha de Vencimiento'}
          </label>
          <p>{new Date(invoice.paidAt || invoice.dueDate).toLocaleDateString()}</p>
        </div>
        {invoice.type === 'stage_payment' && (
          <div className="col-span-2">
            <label className="text-sm font-medium">Tipo de Factura</label>
            <p className="text-sm text-muted-foreground">
              Esta factura corresponde al pago de la etapa "{invoice.stageName}" del proyecto {invoice.projectName}
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => invoice.type === 'stage_payment' ? onDownloadResimple(invoice) : onDownloadInvoice(invoice)}
        >
          <Download className="h-4 w-4 mr-2" />
          {invoice.type === 'stage_payment' ? 'Descargar RESIMPLE' : 'Descargar PDF'}
        </Button>
        <Button variant="outline" className="flex-1" disabled>
          <FileText className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </div>
    </div>
  );
}
