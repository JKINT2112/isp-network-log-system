// Shared brand lockup: MegaFiber Networks logo + name.
// The logo lives in /public so a missing file degrades to a broken image
// instead of failing the build. Drop megafiber-logo.png into frontend/public/.
const LOGO_SRC = '/megafiber-logo.png'

function BrandMark({ className = '' }) {
  return (
    <div className={`brand ${className}`.trim()}>
      <img src={LOGO_SRC} alt="MegaFiber Networks" className="brand-logo" />
      <div>
        <strong>MegaFiber Networks</strong>
        <span>Network Log System</span>
      </div>
    </div>
  )
}

export default BrandMark
