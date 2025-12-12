import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { BillingService } from "./billing.service";
import { checkoutDto } from "./dto/checkout.dto";

const parseOrBadRequest = async <T>(
  schema: z.ZodTypeAny,
  data: unknown,
): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const flat = e.flatten();
      const fieldMessages = Object.entries(flat.fieldErrors).flatMap(
        ([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`),
      );
      const formMessages = flat.formErrors ?? [];
      const messages = [...formMessages, ...fieldMessages];
      throw new BadRequestException(
        messages.length ? messages : ["Invalid request body"],
      );
    }
    throw e;
  }
};

@Controller("billing")
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post("checkout")
  async checkout(@Body() body: unknown) {
    const dto = await parseOrBadRequest<z.infer<typeof checkoutDto>>(
      checkoutDto,
      body,
    );
    return this.service.checkout(dto);
  }
}
