/*
BILLION: Standard legible Terms of Service.
DIRECTION: Text-heavy / Legal
SIGNATURE: Terms
*/

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 md:px-12 max-w-4xl mx-auto font-mono">
       <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">Effective Date: January 1, 2026</p>
       </div>

       <div className="prose prose-invert prose-sm text-muted-foreground space-y-8">
          <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Recognition of Service</h2>
              <p>
                  By accessing CodeFlow Research ("The Service"), you recognize that you are interacting with an autonomous agentic system designed for architectural analysis. 
                  The outputs provided by the Service are probabilistic in nature and should be reviewed by human engineers before implementation in production environments.
              </p>
          </section>

          <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Codebase Access & Security</h2>
              <p>
                  You grant CodeFlow temporary, read-only access to specific repositories for the sole purpose of generating embedding vectors. 
                  We DO NOT store your source code in plain text. All code is processed ephemerally and converted into high-dimensional vector representations stored in an encrypted vector database.
              </p>
          </section>

          <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Limitations of Liability</h2>
              <p>
                  CodeFlow is provided "as is". We make no warranties regarding the accuracy of the generated architectural maps or the safety of the suggested onboarding tasks. 
                  You assume full responsibility for any code changes made based on CodeFlow's recommendations.
              </p>
          </section>

          <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Enterprise Usage</h2>
              <p>
                  Entities using the Service for commercial software development with revenue exceeding $1M/year must utilize the Enterprise tier, which includes specific SLAs and data residency guarantees not available in the Hobbyist tier.
              </p>
          </section>
       </div>
    </div>
  )
}
