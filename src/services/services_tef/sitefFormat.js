export default class SitefFormat {
  formatSitefEntrysToJson(sitefFunctions, sitefEntrys) {
    let mapMsiTef = new Map();

    mapMsiTef.empresaSitef = sitefEntrys.getEmpresaSitef();
    mapMsiTef.enderecoSitef = sitefEntrys.getIp();
    mapMsiTef.operador = '0001';
    mapMsiTef.data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    mapMsiTef.hora = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(11, 19).replace(/:/g, '');
    mapMsiTef.numeroCupom = Math.floor(Math.random() * 9999999).toString();
    mapMsiTef.valor = sitefEntrys.getValue().toString();
    mapMsiTef.CNPJ_CPF = '24880034000186';
    mapMsiTef.cnpj_automacao = '12127195000114';
    mapMsiTef.comExterna = '4';
    mapMsiTef.tipoPinpad = 'ANDROID_USB';
    mapMsiTef.tokenRegistroTls = '3847-7582-7426-2017';

    if (sitefFunctions === 'SALE') {
      mapMsiTef.modalidade = this.paymentToYourCode(
        sitefEntrys.getPaymentMethod(),
      );

      if (sitefEntrys.getPaymentMethod() === 'Crédito') {
        if (
          sitefEntrys.getNumberInstallments() === 1 ||
          sitefEntrys.getNumberInstallments() === 0
        ) {
          mapMsiTef.transacoesHabilitadas = '26';
        } else if (sitefEntrys.getInstallmentsMethods() === 'Loja') {
          mapMsiTef.transacoesHabilitadas = '27';
        } else if (sitefEntrys.getInstallmentsMethods() === 'Adm') {
          mapMsiTef.transacoesHabilitadas = '28';
        }

        mapMsiTef.numParcelas = sitefEntrys.getNumberInstallments().toString();
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
        return '0';
    }
  }
}
