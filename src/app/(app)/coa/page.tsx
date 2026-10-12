import { PageHeader } from "@/components/page-header";
import { AddCoaDialog } from "@/components/add-coa-dialog";
import { EditCoaDialog } from "@/components/edit-coa-dialog";
import { DeleteCoaButton } from "@/components/delete-coa-dialog";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCoaStats } from "@/db/queries";

export default async function CoaPage() {
  const accounts = await getCoaStats();

  return (
    <>
      <PageHeader kicker="Pengaturan" title="Chart of Accounts">
        <AddCoaDialog />
      </PageHeader>

      <Card className="gap-0 overflow-hidden rounded-[22px] border-border py-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-32">Kode</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-14 text-center text-sm text-muted-foreground">
                    Belum ada COA. Tambahkan lewat tombol &ldquo;Tambah COA&rdquo; di atas.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-variant-tabular whitespace-nowrap">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditCoaDialog id={a.id} currentCode={a.code} currentName={a.name} />
                        <DeleteCoaButton id={a.id} code={a.code} name={a.name} count={a.count} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
