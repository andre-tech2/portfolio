import Modal from './Modal'

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Trocar minha senha" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Essa opção é apenas de teste e não está disponível nesta demonstração.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
          >
            Entendi
          </button>
        </div>
      </div>
    </Modal>
  )
}
