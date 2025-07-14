import Logo from "../../../assets/icon.png"

export default function MainPage() {
  return (
    <div className="p-4 flex flex-col justify-center items-center h-full">
      <img src={Logo} height={60} width={60} />
      <h1 className="dark:text-white mt-4">Blinkaway</h1>
      <p className='dark:text-muted-foreground text-center'>Welcome to Blinkaway. Your eyes are safe from now onwards!</p>
      <small className='dark:text-white mt-2 text-muted-foreground'>Blink away is active. You can close this window.</small>
    </div>
  );
}