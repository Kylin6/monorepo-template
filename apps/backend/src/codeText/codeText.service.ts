import { Injectable } from "@nestjs/common";
import { CODE_TEXT_MAPPINGS, type CodeTextMappings } from "@common/index";

@Injectable()
export class CodeTextService {
  getCodeTexts(): CodeTextMappings {
    return CODE_TEXT_MAPPINGS;
  }
}
