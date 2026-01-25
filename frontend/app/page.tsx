import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Intelligent, Automated <span className="text-primary">Multi-Vault</span> Yield Generation
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            ForgeX is a decentralized asset management protocol that automates yield generation across multiple DeFi protocols using the ERC-4626 standard.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">Launch App</Button>
            </Link>
            <Link href="https://github.com/thebabalola/ForgeX" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Powerful Features for Modern DeFi
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ForgeX provides a suite of tools to maximize your yield securely and efficiently.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <div className="grid gap-1">
              <h3 className="text-lg font-bold">Multi-Vault Architecture</h3>
              <p className="text-sm text-muted-foreground">
                Deploy multiple, isolated ERC-4626 vaults, each with its own strategy and assets.
              </p>
            </div>
            <div className="grid gap-1">
              <h3 className="text-lg font-bold">Automated Yield Rotation</h3>
              <p className="text-sm text-muted-foreground">
                Our smart contracts automatically move assets between protocols like Aave and Compound to find the best yield.
              </p>
            </div>
            <div className="grid gap-1">
              <h3 className="text-lg font-bold">Standardized & Composable</h3>
              <p className="text-sm text-muted-foreground">
                Built on the ERC-4626 tokenized vault standard for maximum compatibility across the DeFi ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
