import { RetentionService } from "./retention.service";

async function main() {
  const svc = new RetentionService();
  await svc.run();
  // eslint-disable-next-line no-console
  console.log("Retention run complete");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Retention run failed", err);
  process.exit(1);
});

