import { RetentionService } from "./retention.service";

async function main() {
  const svc = new RetentionService();
  await svc.run();
  console.log("Retention run complete");
}

main().catch((err) => {
  console.error("Retention run failed", err);
  process.exit(1);
});
