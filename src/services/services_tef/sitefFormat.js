export default class SitefFormat {
  formatSitefEntrysToJson(sitefFunctions, sitefEntrys) {
    let mapMsiTef = new Map();

    // PROD
    mapMsiTef.empresaSitef = "24880034";
    mapMsiTef.enderecoSitef = "tls-prod.fiservapp.com";
    mapMsiTef.operador = '0001';
    mapMsiTef.data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    mapMsiTef.hora = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(11, 19).replace(/:/g, '');
    mapMsiTef.numeroCupom = Math.floor(Math.random() * 9999999).toString();
    mapMsiTef.valor = sitefEntrys.getValue().toString();
    mapMsiTef.CNPJ_CPF = '24880034000186';
    mapMsiTef.cnpj_automacao = '12127195000114';
    mapMsiTef.comExterna = '4';
    mapMsiTef.tipoPinpad = 'ANDROID_USB';
    mapMsiTef.tokenRegistroTls = '7174-4567-9308-1943';

    // DEV
    // mapMsiTef.empresaSitef = "00000000";
    // mapMsiTef.enderecoSitef = "192.168.1.11";
    // mapMsiTef.operador = "0001";
    // mapMsiTef.data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // mapMsiTef.hora = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(11, 19).replace(/:/g, "");
    // mapMsiTef.numeroCupom = Math.floor(Math.random() * 9999999).toString();
    // mapMsiTef.valor = sitefEntrys.getValue().toString();
    // mapMsiTef.CNPJ_CPF = "00000000000000";
    // mapMsiTef.cnpj_automacao = "00000000000000";
    // mapMsiTef.comExterna = "0";
    // mapMsiTef.tipoPinpad = "ANDROID_USB";

    if (sitefFunctions === 'SALE') {
      mapMsiTef.modalidade = this.paymentToYourCode(
        sitefEntrys.getPaymentMethod(),
      );

      if (sitefEntrys.getPaymentMethod() === 'Crédito') {
        mapMsiTef.transacoesHabilitadas = '26';
        mapMsiTef.numParcelas = '1';
      }
      if (sitefEntrys.getPaymentMethod() === 'Débito') {
        mapMsiTef.transacoesHabilitadas = '16';
      }
      if (sitefEntrys.getPaymentMethod() === 'Pix') {
        mapMsiTef.transacoesHabilitadas = '7;8;';
      }
    }

    if (sitefFunctions === 'CONFIGS') {
      mapMsiTef.modalidade = '110';
      mapMsiTef.isDoubleValidation = '0';
      mapMsiTef.restricoes = 'TransacoesAdicionaisHabilitadas=7;8;3919';
    }

    if (sitefFunctions === 'REIMPRESSAO') {
      mapMsiTef.modalidade = '113';
      mapMsiTef.transacoesHabilitadas = '58';
    }

    if (sitefFunctions === 'CANCEL') {
      mapMsiTef.modalidade = '200';
      mapMsiTef.isDoubleValidation = '0';
      mapMsiTef.restricoes = 'TransacoesAdicionaisHabilitadas=7;8;3919';
    }

    return mapMsiTef;
  }

  paymentToYourCode(payment) {
    switch (payment) {
      case 'Crédito':
        return '3';
      case 'Débito':
        return '2';
      default:
        return '122';
    }
  }
}
