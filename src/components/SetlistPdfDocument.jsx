import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Estilos padronizados para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  eventName: {
    fontSize: 28,
    fontWeight: 'extrabold',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  bandDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  // Container Flex para as duas colunas
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Item de Música (47% de largura para caberem 2 por linha com espaçamento)
  songItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  songIndex: {
    fontSize: 16,
    color: '#999999',
    width: 28,
    fontFamily: 'Helvetica-Bold',
  },
  songTitle: {
    fontSize: 16,
    color: '#000000',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  // Divisores de Sessão
  dividerItem: {
    width: '47%',
    marginBottom: 16,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  dividerText: {
    fontSize: 12,
    color: '#000000',
    backgroundColor: '#eeeeee',
    padding: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  }
});

// Função para cortar strings muito longas (limite de caracteres)
const truncate = (str, max) => {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 2) + ".." : str;
};

export const SetlistPdfDocument = ({ eventName, bandName, date, orderedItems, songMap }) => {
  let songCounter = 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Cabeçalho do Evento */}
        <View style={styles.header}>
          <Text style={styles.eventName}>{eventName || "MEU SETLIST"}</Text>
          <View style={styles.bandDateRow}>
            <Text style={styles.subtitle}>{bandName || "Banda / Artista"}</Text>
            <Text style={styles.subtitle}>
              {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : ""}
            </Text>
          </View>
        </View>

        {/* Grade de 2 Colunas */}
        <View style={styles.grid}>
          {orderedItems.map((item, idx) => {
            
            // Renderiza o Divisor
            if (item.item_type === 'divider') {
              return (
                <View key={item.id || idx} style={styles.dividerItem}>
                  <Text style={styles.dividerText}>{truncate(item.content || "---", 25)}</Text>
                </View>
              );
            }

            // Renderiza a Música Real
            const song = songMap[item.song_id];
            const currentIndex = songCounter++;
            const title = song ? song.title : "Música Deletada";

            return (
              <View key={item.id || idx} style={styles.songItem}>
                <Text style={styles.songIndex}>{currentIndex.toString().padStart(2, '0')}</Text>
                {/* Limita o nome da música a 22 caracteres para não estourar a coluna */}
                <Text style={styles.songTitle}>{truncate(title, 22)}</Text>
              </View>
            );
          })}
        </View>

      </Page>
    </Document>
  );
};