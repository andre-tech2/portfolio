import Modal from './Modal'

export default function ImportResultModal({ report, onClose }: { report: ImportReport; onClose: () => void }) {
  const totalCriadas = report.novasCriadas + report.antigasCriadas
  const totalAtualizadas = report.novasAtualizadas + report.antigasAtualizadas

  return (
    <Modal title="Resultado da importação" onClose={onClose} wide>
      <div className="space-y-3 text-sm">
        <ul className="space-y-1.5">
          <li className="text-text-primary">
            <span className="text-ok-text font-semibold">{totalCriadas}</span> criada(s) e{' '}
            <span className="text-ok-text font-semibold">{totalAtualizadas}</span> atualizada(s)
          </li>
        </ul>

        {report.ignoradas > 0 && (
          <div className="pt-2 border-t border-surface-border/10">
            <p className="text-warn-text font-semibold mb-1">{report.ignoradas} linha(s) ignorada(s)</p>
            <ul className="text-xs text-text-muted list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
              {report.detalhesIgnorados.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  )
}
